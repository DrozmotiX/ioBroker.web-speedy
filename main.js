'use strict';

/*
 * Created with @iobroker/create-adapter v1.21.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
const state_attr = require(__dirname + '/lib/state_attr.js');

let test_running = false, intervall_time = null, timer = null;

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
		this.bestServers = [];
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Reset the connection indicator during startup
		this.setState('info.connection', false, true);
		this.log.info('Web Speedy  startet, getting list of closest servers ');

		// Create state to manually run test 
		this.create_state('test_best', 'test_best', false);
  
		// Create State for Download indicator
		this.create_state('running_download', 'running_download', false);
		// Create State for Upload indicator
		this.create_state('running_upload', 'running_upload', false);

		// Subscribe to important states
		this.subscribeStates('test_best');
		this.subscribeStates('test_auto_intervall');

		// Initial run to get best-servers and run a first test creating all wanted data-points
		await this.test_run();
		// Shedule automated execution
		await this.intervall_runner();
		this.log.info('Automated scan every : ' + intervall_time + ' minutes :-)');
	}

	async test_run(target_server){
		this.log.info('The speed test has been started ... ');		
		if (!target_server) {
			// Run test om specific server
			require('speedtest-net')({maxTime: 5000, serverId: target_server });
		} else {
			// run test on best server found
			require('speedtest-net')({maxTime: 5000});
		}

		// Fired when an error occurs. The error is written to log when received.
		require('speedtest-net')().on('error', err => {
			this.log.error(err);

			// Reset all states to non-running state
			this.setState('info.connection', false, true);
			this.setNotRunning();
		});

		// Test show config
		require('speedtest-net')().on('config', config => {
			this.log.debug('Configuration info : ' + JSON.stringify(config));
			
			// Set all states to running state
			this.setRunning();
		});

		// require('speedtest-net')().on('downloadprogress', progress => {
		// 	this.log.info('Download progress:', progress);
		// });

		// require('speedtest-net')().on('uploadprogress', progress => {
		// 	this.log.info('Upload progress:', progress);
		// });

		// Monitor download speed
		require('speedtest-net')().on('downloadspeed', speed => {
			this.setRunning();
			this.setState('running_download', false, true);
			this.log.debug('Download speed : ' + (speed * 125).toFixed(2));
		});

		require('speedtest-net')().on('uploadspeed', speed => {
			this.setRunning();
			this.setState('running_upload', false, true);
			this.setState('running_download', false, true);
			this.log.debug('Upload speed : ' + (speed * 125).toFixed(2));
		});

		require('speedtest-net')().on('downloadspeedprogress', speed => {
			this.setRunning();
			this.setState('running_download', true, true);
			// this.log.info('Download speed (in progress) : ' + (speed * 125).toFixed(2));
		});

		require('speedtest-net')().on('uploadspeedprogress', speed => {
			this.setRunning();
			this.setState('running_upload', true, true);
			// this.log.info('Upload speed (in progress) : ' + (speed * 125).toFixed(2));
		});

		// Execute when data is publish at test-end
		// require('speedtest-net')().on('result', url => {
		// 	if (!url) {
		// 		this.log.error('Could not successfully post test results.');
		// 	} else {
		// 		this.log.info('Test result url:', url);
		// 	}
		// });

		// Get best server results and write to states
		require('speedtest-net')().on('bestservers', serverlist => {
			// Reset the connection indicator during startup
			this.setRunning();
			this.log.debug('Closest servers : ' + JSON.stringify(serverlist));
			this.bestServers = serverlist;

			this.extendObject('Closest_servers', {
				type: 'channel',
				common: {
					name: 'Closest servers pinged at last test',
				},
				native: {},
			});

			try {
				
				for (const i in serverlist) {
					this.log.debug('Closest server : ' + i + ' : ' + JSON.stringify(serverlist[i]));

					this.extendObject('Closest_servers.' + i, {
						type: 'channel',
						common: {
							name: 'Closest server ' + i,
						},
						native: {},
					});

					for (const  x in serverlist[i]){

						this.create_state('Closest_servers.' + i + '.' + x, x, serverlist[i][x]);
					}
				}

				// Create state to run test on specific server (top 5 retrieved from scan)
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
				this.log.error(error);
			}

			try {
				// At server lookup a test is excuted, nomanuel trigger needed
				this.log.info('Closest server found, running test');
				
			} catch (error) {
				this.log.error(error);
				
			}
				
		});

		// Get all test-result data (to much information)
		require('speedtest-net')().on('done', dataOverload => {
			// this.log.info('Speed test finished, result : ' + JSON.stringify(dataOverload));
			this.log.info('The speed test has completed successfully.');

			this.setNotRunning();

		});

		// Write Speed-test results to state
		require('speedtest-net')().on('data', data => {
			this.log.debug('Test Result Data : ' + JSON.stringify(data));
			this.extendObject('Results', {
				type: 'channel',
				common: {
					name: 'Test results of latest run',
				},
				native: {},
			});

			this.log.debug('Test results : ' + JSON.stringify(data));
			this.create_state('Results.Last_Run', 'Last_Run_Timestamp', new Date());
			for (const i in data) {

				this.extendObject('Results.' + i, {
					type: 'channel',
					common: {
						name: i,
					},
					native: {},
				});

				for (const  x in data[i]){

					this.create_state('Results.' + i + '.' + x, x, data[i][x]);
				}
			}
			this.setNotRunning();
		});
	}

	async intervall_runner(){

		intervall_time = await this.getStateAsync('test_auto_intervall');

		if (!intervall_time || (intervall_time && intervall_time.val === null)) {
			await this.setStateAsync('test_auto_intervall', {val : 30, ack : true});
			intervall_time = 30;
		} else if (intervall_time && intervall_time.val !== null){
			intervall_time = intervall_time.val;
			await this.setStateAsync('test_auto_intervall', {ack : true});
		}

		// Reset timer (if running) and start new one
		this.log.info('Start timer with : ' + (intervall_time * 60000));
		if (timer) {clearTimeout(timer); timer = null;}
		timer = setTimeout( () => {
			this.log.info('Execute timer with : ' + (intervall_time * 60000) + ' Currently running : ' + test_running);
			if (!test_running){
				this.test_run();
			}
			this.intervall_runner();
		}, (intervall_time * 60000));
	}

	onStateChange(id, state) {
		this.log.debug('State Change event : ' + id + ' value : ' + JSON.stringify(state));
		if (state && state.ack === false) {
			const deviceId = id.split('.');
			const device = deviceId[2];

			if (!test_running) {

				switch (device) {

					case('test_best'):
						this.log.info('Manuel test startet on best server');
						this.test_run();
						test_running = true;
						break;

					case('test_specific'):
						this.log.info('Manuel test startet on selected server ID : ' + state.val);
						this.test_run(state.val);
						test_running = true;

						break;

					case('test_auto_intervall"'):

						break;

					default:
				}
			}

			if (device === 'test_auto_intervall'){
				// Reshedule intervalls
				this.intervall_runner();
				this.log.info('Automated scan changed to every : ' + state.val + ' minutes :-)');
			}
		}
	}

	setRunning(){
		if (!test_running){
			this.setState('info.connection', true, true);
			this.setState('running', true, true);
			test_running = true;
		}
	}

	setNotRunning(){
		this.setState('running', false, true);
		this.setState('running_download', false, true);
		this.setState('running_upload', false, true);
		test_running = false;
	}

	async create_state(state, name, value){
		this.log.debug('Create_state called for : ' + state + ' with value : ' + value);

		try {

			// Try to get details from state lib, if not use defaults. throw warning is states is not known in attribute list
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

			await this.setState(state, {val: value, ack: true});

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