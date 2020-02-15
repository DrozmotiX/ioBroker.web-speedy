'use strict';

/*
 * Created with @iobroker/create-adapter v1.21.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load speedtest-net thank you @ddsol !
const state_attr = require(__dirname + '/lib/state_attr.js');
const speedTest = require('speedtest-net');

// Declare used varaibles
let run_test = null, test_running = false, down_ready = null, up_ready = null;
let intervall_time = null, timer = null, stop_timer = null, test_duration = null;
let test_server_id = null, test_server_url = null, running_mode;
let server_id = null, server_url = null;

// const fs = require("fs");

class WebSpeedy extends utils.Adapter {

	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: 'web-speedy',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('unload', this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Reset the connection & statuus indicators during startup
		this.setState('info.connection', false, true);
		this.setNotRunning(true);

		// Create state to manually run test & sped indicators
		this.create_state('test_best', 'test_best', false);  
		this.create_state('running_download', 'running_download', false);
		this.create_state('running_upload', 'running_upload', false);

		// Subscribe to configuration states
		this.subscribeStates('test_best');
		this.subscribeStates('test_by_ID');
		this.subscribeStates('test_by_URLs');
		this.subscribeStates('test_duration');
		this.subscribeStates('test_auto_modus');
		this.subscribeStates('test_specific_id');
		this.subscribeStates('test_specific_url');
		this.subscribeStates('test_auto_intervall');
		
		// Shedule automated execution
		await this.intervall_runner();

		// Initial run to get best-servers and run a first test creating all wanted data-points
		// Ignore if no automated intervall time is set
		if (intervall_time !== 0) {
			this.log.info('Web Speedy startet, getting list of closest servers ');
			await this.test_run(0); // Initial run on best Server
			this.log.info('Automated scan every : ' + intervall_time + ' minutes :-)');
		}
	}

	async test_run(run_type, best_id){

		// Get configuration of max duration time for scans
		const duration_time = await this.getStateAsync('test_duration');
		if (!duration_time || (duration_time.val * 1000) < 5000) {
			this.log.warn('Invalid value set for test duration, ignoring value  and set to default');
			test_duration = 15000;
			await this.setStateAsync('test_duration', {val : 15, ack : true});
		} else {
			test_duration = duration_time.val * 1000;
		}


		// Select running mode, run default in case of error during selection

		try {

			switch(run_type){

				case(0):
					// Run test on Best Server found
					this.log.info('Run test on on Best Server found');
					run_test = speedTest({maxTime: test_duration});
					break;
					
				case(1):
					// Get configuration of pecific server id if configured for scan
					server_id = await this.getStateAsync('test_specific_id');
					if (server_id !== null && server_id !== undefined) {test_server_id = '"' + server_id.val + '"';
						// Run test on configured server by id

						if (best_id){test_server_id = '"' + best_id  + '"';}
						this.log.info('Run test on configured server by id : ' + test_server_id);
						run_test = speedTest({maxTime: test_duration, serverId: test_server_id});

						// run_test = speedTest({maxTime: test_duration, serverId: test_server_id});
					}  else {
						this.log.warn('Error Case 1 selecting specific server, running Best_Server mode');
						run_test = speedTest({maxTime: test_duration});
					}

					break;

				case(2):
					// Get configuration of pecific server id if configured for scan
					server_url = await this.getStateAsync('test_specific_url');
					if (server_url !== null && server_url !== undefined) {test_server_url = '"' + server_url.val + '"';
						// Run test on configured server by url
						this.log.info('Run test on configured server by url : ' + test_server_url);
						run_test = speedTest({maxTime: test_duration, serversUrl: test_server_url});
					}  else {
						this.log.warn('Error Case 2 selecting specific server, running Best_Server mode');
						run_test = speedTest({maxTime: test_duration});
					}
					break;

				default:
					this.log.warn('Error No Case selecting specific server, running Best_Server mode');
					run_test = speedTest({maxTime: test_duration});
			}

			
		} catch (error) {
			this.log.warn('Error selecting specific server, running Best_Server mode : ' + error);
			run_test = speedTest({maxTime: test_duration});

		}

		this.log.info('The speed test has been started and will take at maximum ' + (test_duration / 1000) + ' seconds for a single test run');		

		// Fired when an error occurs. The error is written to log when received.
		run_test.on('error', err => {
			this.log.error(err);

			// Reset all states to non-running state
			this.setState('info.connection', false, true);
			this.setNotRunning(); // Reset all status indicators to not-running
		});

		// Fired when module has been triggered  providing configuration 
		run_test.on('config', config => {
			this.log.info('Configuration info : ' + JSON.stringify(config));
			
			// Set all states to running state
			this.setRunning();
		});

		// Monitor download progress % (not working)
		run_test.on('downloadprogress', progress => {
			this.log.debug('Download progress : ' + progress);
			this.create_state('running_download_progress', 'running_download_progress', progress);

		});

		// Monitor upload progress % (not working)
		run_test.on('uploadprogress', progress => {
			this.log.debug('Upload progress : ' + progress);
			this.create_state('running_upload_progress', 'running_upload_progress', progress);
		});

		// Fired when download is finished
		run_test.on('downloadspeed', speed => {
			this.setState('running_download', false, true);	
			this.setState('running_download_speed', 0, true);
			this.log.debug('Download speed : ' + (speed * 125).toFixed(2));
		});

		// Fired when upload is finished
		run_test.on('uploadspeed', speed => {
			this.setState('running_upload', false, true);
			this.setState('running_upload_speed', 0, true);
			this.log.debug('Upload speed : ' + (speed * 125).toFixed(2));
		});

		// Monitor download speed kb/s
		run_test.on('downloadspeedprogress', speed => {

			this.log.debug('Download speed (in progress) : ' + (speed * 125).toFixed(2) + ' kb/s');
			if (down_ready !== true){
				down_ready = true;
				this.setState('running_download', true, true);
			}
			this.create_state('running_download_speed', 'running_upload_speed', (speed * 125).toFixed(2));
		});

		// Monitor upload speed kb/s
		run_test.on('uploadspeedprogress', speed => {
			this.log.debug('Upload speed (in progress) : ' + (speed * 125).toFixed(2) + ' kb/s');
			if (up_ready !== true){
				up_ready = true;
				this.setState('running_upload', true, true);
			}
			this.create_state('running_upload_speed', 'running_upload_speed', (speed * 125).toFixed(2));
		});

		// Execute when data is publish at test-end (not working)
		// run_test.on('result', url => {
		// 	if (!url) {
		// 		this.log.error('Could not successfully post test results.');
		// 	} else {
		// 		this.log.info('Test result url:', url);
		// 	}
		// });

		// Get best server results and write to states and create drop-down menu to run specific test
		run_test.on('bestservers', serverlist => {
			this.setRunning();
			this.log.debug('Closest servers : ' + JSON.stringify(serverlist));

			// Create channel for list of closest servers with all details
			this.extendObject('Closest_servers', {
				type: 'channel',
				common: {
					name: 'Closest servers pinged at last test',
				},
				native: {},
			});

			// Write Server details to states
			try {
				
				// Loop array of server
				for (const i in serverlist) {
					this.log.debug('Closest server : ' + i + ' : ' + JSON.stringify(serverlist[i]));

					// Create Server Channels
					this.extendObject('Closest_servers.' + i, {
						type: 'channel',
						common: {
							name: 'Closest server ' + i,
						},
						native: {},
					});

					// Create and write information to states
					for (const  x in serverlist[i]){
						this.create_state('Closest_servers.' + i + '.' + x, x, serverlist[i][x]);
					}
				}

				// Create state to run test on specific server with drop-down menu(top 5 retrieved from scan)
				this.extendObject('test_specific', {
					type: 'state',
					common: {
						name: 'Run test on selected server',
						type: 'mixed',
						role: 'state',
						write: true,
						states: {
							[serverlist[0]['id']] : 'name : ' + serverlist[0]['sponsor'] + ' Last Ping : ' + serverlist[0]['bestPing'],
							[serverlist[1]['id']] : 'name : ' + serverlist[1]['sponsor'] + ' Last Ping : ' + serverlist[1]['bestPing'],
							[serverlist[2]['id']] : 'name : ' + serverlist[2]['sponsor'] + ' Last Ping : ' + serverlist[2]['bestPing'],
							[serverlist[3]['id']] : 'name : ' + serverlist[3]['sponsor'] + ' Last Ping : ' + serverlist[3]['bestPing'],
							[serverlist[4]['id']] : 'name : ' + serverlist[4]['sponsor'] + ' Last Ping : ' + serverlist[4]['bestPing'],
						},
					},
					native: {},
				});

				this.setState('test_specific', {val: '', ack: true});
				this.subscribeStates('test_specific');

			} catch (error) {
				// this.log.error(error);
			}

			this.log.info('Closest server found, running test');

		});

		// Get all test-result data (to much information, ignoring results)
		// eslint-disable-next-line no-unused-vars
		run_test.on('done', dataOverload => {
			// this.log.info('Speed test finished, result : ' + JSON.stringify(dataOverload));
			this.log.info('The speed test has been completed successfully.');
			this.setNotRunning(); // Reset all status indicators to not-running
		});

		// Fired at test end providing JSON-array with all  data
		run_test.on('data', data => {
			this.log.debug('Test Result Data : ' + JSON.stringify(data));
			// Create channle for test-results
			this.extendObject('Results', {
				type: 'channel',
				common: {
					name: 'Test results of latest run',
				},
				native: {},
			});

			// Write Speed-test results to state
			this.log.debug('Test results : ' + JSON.stringify(data));
			this.create_state('Results.Last_Run', 'Last_Run_Timestamp', new Date());
			for (const i in data) {

				// Create channel for each cathegorie
				this.extendObject('Results.' + i, {
					type: 'channel',
					common: {
						name: i,
					},
					native: {},
				});

				// Loop data-array and write values to states
				for (const  x in data[i]){

					switch (x) {

						// Make propper calculation for download speed in Mbit and MByte
						case('download'):
							this.create_state('Results.' + i + '.download_MB', 'download_MB', (data[i][x] / 8));
							this.create_state('Results.' + i + '.download_Mb', 'download_Mb', data[i][x]);
							break;
	
						case('upload'):
							this.create_state('Results.' + i + '.upload_MB', 'upload_MB', (data[i][x] / 8 ));
							this.create_state('Results.' + i + '.upload_Mb', 'upload_Mb', data[i][x]);
							break;
	
						default:
							// Write alle regular states without conversion
							this.create_state('Results.' + i + '.' + x, x, data[i][x]);
					}

				}
			}
			this.setNotRunning(); // Reset all status indicators to not-running
		});
	}

	// Intervall timer to run automated tests
	async intervall_runner(){

		// Get intervall time configuration
		intervall_time = await this.getStateAsync('test_auto_intervall');

		// Propper handling of shedule, if NULL set to default (30 minutes)
		if (!intervall_time || (intervall_time && intervall_time.val === null)) {
			await this.setStateAsync('test_auto_intervall', {val : 30, ack : true});
			intervall_time = 30;
		} else if (intervall_time && intervall_time.val !== null){
			intervall_time = intervall_time.val;
		}

		// Get intervall running mode configuration
		const test_auto_modus = await this.getStateAsync('test_auto_modus');
		if (!test_auto_modus) {
			this.log.warn('Invalid value set for auto modus, ignoring value and set to default');
			running_mode = 0; // Run on best server found
			await this.setStateAsync('test_auto_modus', {val : 0, ack : true});
		} else {
			running_mode = test_auto_modus.val;
		}

		this.log.debug('Start timer with : ' + (intervall_time * 60000));

		// Disable time if test_auto_intervall is set to 0
		if (intervall_time !== 0) {
			// Reset timer (if running) and start new one
			await this.setStateAsync('test_auto_intervall', {ack : true});
			if (timer) {clearTimeout(timer); timer = null;}
			timer = setTimeout( () => {
				this.log.info('Execute timer with : ' + (intervall_time * 60000) + ' Currently running : ' + test_running);
				if (!test_running){
					this.test_run(running_mode);
				}
				// Restart intervall at run
				this.intervall_runner();

				// Set timer, minutes to milliseconds
			}, (intervall_time * 60000));

		} else {
			// 0 intervall time configured, disabling auto shedule
			if (timer) {clearTimeout(timer); timer = null;}
			this.log.warn('!!! Automated test disabled !!!');
			await this.setStateAsync('test_auto_intervall', {ack : true});

		}
	}

	// Handle configuration changes and test-start trigger
	onStateChange(id, state) {
		this.log.debug('State Change event : ' + id + ' value : ' + JSON.stringify(state));

		// Check if valid state change is received with not-acknowledged value
		if (state && state.ack === false) {

			// Get state name
			const deviceId = id.split('.');
			const device = deviceId[2];

			// Only handle cases for different states if not test is  currenlty running
			if (!test_running) {

				switch (device) {

					case('test_best'):
						this.test_run(0);
						this.setRunning();
						this.setState('test_best', {ack: true});
						this.log.info('Manuel test startet on best server');
						break;

					case('test_by_ID'):
						this.test_run(1);
						this.setRunning();
						this.log.info('Manuel test startet for specific server ID');
						this.setState('test_by_ID', {ack: true});
						break;

					case('test_by_URL'):
						this.test_run(2);
						this.setRunning();
						this.log.info('Manuel test startet for specific server URL');
						this.setState('test_by_ID', {ack: true});						
						break;

					case('test_specific'):
						this.test_run(1,state.val);
						this.setRunning();
						this.log.info('Manuel test startet for best avaiable server ID : ' + state.val);
						this.setState('test_specific', {val: null, ack: true});
						break;

					case('test_specific_id'):
						// Acknowledge ID change
						this.log.info('Test pecific server ID changed');
						this.setState('test_specific_id', {ack: true});
						break;

					case('test_specific_url'):
						// Acknowledge ID change
						this.log.info('Test pecific server URL changed');
						this.setState('test_specific_id', {ack: true});
						break;

					case('test_auto_intervall'):
						this.intervall_runner();
						this.setState('test_auto_intervall', {ack: true});
						this.log.info('Automated scan changed to every : ' + state.val + ' minutes');
						break;

					case('test_auto_modus'):
						this.intervall_runner();
						this.setState('test_auto_modus', {ack: true});
						this.log.info('Automated scan mode changed.');
						break;

					case('test_duration'):
						this.setState('test_duration', {ack: true});
						this.log.info('Maximum test duration changed to  : ' + state.val + ' seconds');
						break;

					default:
				}
			}
		}
	}

	// Set all status indicators to running state
	setRunning(){
		if (!test_running){
			this.setState('info.connection', true, true);
			this.setState('running', true, true);
			test_running = true;
		}
	}

	// Set all status indicators to not-running state
	setNotRunning(start){

		// Different delay times for adapter start and running mode
		let  delay_time = null;
		if (start ===  true){
			delay_time = 10;
		}  else {
			delay_time = 5000;
		}

		// a little delay to ensure all backend processes are finished
		if (stop_timer) {clearTimeout(stop_timer); stop_timer = null;}
		if (start !==  true){
			stop_timer = setTimeout( () => {
				this.setState('running', false, true);
				this.setState('running_download_speed', 0, true);
				this.setState('running_upload_speed', 0, true);
				this.setState('running_download', false, true);
				this.setState('running_upload', false, true);
				down_ready = false;
				up_ready = false;
				test_running = false;
			}, delay_time);
		}
	}

	async create_state(state, name, value){
		this.log.debug('Create_state called for : ' + state + ' with value : ' + value);

		try {
			// Try to get details from state lib, if not use defaults. throw warning if states is not known in attribute list
			if((state_attr[name] === undefined)){this.log.warn('State attribute definition missing for + ' + name);}
			const writable = (state_attr[name] !== undefined) ?  state_attr[name].write || false : false;
			const state_name = (state_attr[name] !== undefined) ?  state_attr[name].name || name : name;
			const role = (state_attr[name] !== undefined) ?  state_attr[name].role || 'state' : 'state';
			const type = (state_attr[name] !== undefined) ?  state_attr[name].type || 'mixed' : 'mixed';
			const unit = (state_attr[name] !== undefined) ?  state_attr[name].unit || '' : '';
			this.log.debug('Write value : ' + writable);

			await this.extendObjectAsync(state, {
				type: 'state',
				common: {
					name: state_name,
					role: role,
					type: type,
					unit: unit,
					write : writable
				},
				native: {},
			});

			// Only set value if input != null
			if (value !== null) {await this.setState(state, {val: value, ack: true});}

			// Subscribe on state changes if writable
			if (writable === true) {this.subscribeStates(state);}

		} catch (error) {
			this.log.error('Create state error = ' + error);
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			this.log.info('cleaned everything up...');
			// clear running timers
			if (timer) {clearTimeout(timer); timer = null;}
			if (stop_timer) {clearTimeout(stop_timer); stop_timer = null;}

			callback();
		} catch (e) {
			callback();
		}
	}

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<ioBroker.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new WebSpeedy(options);
} else {
	// otherwise start the instance directly
	new WebSpeedy();
}