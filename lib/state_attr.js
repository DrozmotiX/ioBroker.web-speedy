// Classification of all state attributes possible
const state_attrb = {
    // Speed results
    'running_download': {
        name: 'Currently download test in progress ?',
        type: 'boolean',
        role: 'info.status',
    },
    'running_download_speed': {
        name: 'Current download kb/s of test',
        type: 'number',
        role: 'info.status',
        unit: 'kb/s',
    },
    'running_download_progress': {
        name: 'Current download progress in %',
        type: 'number',
        role: 'info.status',
        unit: '%',
    },
    'running_upload': {
        name: 'Currently download test in progress ?',
        type: 'boolean',
        role: 'info.status',
    },
    'running_upload_speed': {
        name: 'Current upload kb/s of test',
        type: 'number',
        role: 'info.status',
        unit: 'kb/s',
    },
    'running_upload_progress': {
        name: 'Current upload progress in %',
        type: 'number',
        role: 'info.status',
        unit: '%',
    },
    'running': {
        name: 'Currently Speed test in progress ?',
        type: 'boolean',
        role: 'info.status',
    },    
    'download_MB': {
        name: 'Download bandwidth in MegaBytes per second',
        type: 'number',
        role: 'state',
        unit: 'MB/s',
    },
    'download_Mb': {
        name: 'Download bandwidth in Megabits per second',
        type: 'number',
        role: 'state',
        unit: 'Mb/s',
    },
    'upload_MB': {
        name: 'Upload bandwidth in MegaBytes per second',
        type: 'number',
        role: 'state',
        unit: 'MB/s',
    },
    'upload_Mb': {
        name: 'Upload bandwidth in Megabits per second',
        type: 'number',
        role: 'state',
        unit: 'Mb/s',
    },
    'originalDownload': {
        name: 'Unadjusted downloadh bandwidth in bytes per second',
        type: 'number',
        role: 'state',
        unit: 'b/s',
    },
    'originalUpload': {
        name: 'Unadjusted upload bandwidth in bytes per second',
        type: 'number',
        role: 'state',
        unit: 'b/s',
    },

    // Client details
    'ip': {
        name: 'Ip of client',
        type: 'number',
        role: 'info.ip',
    },
    'lat': {
        name: 'Latitude of location',
        type: 'number',
        role: 'value.gps.latitude ',
        unit: '°',
    },
    'lon': {
        name: 'Longtitude of location',
        type: 'number',
        role: 'value.gps.longtitude ',
        unit: '°',
    },
    'isp': {
        name: 'Clients ISP',
        type: 'mixed',
        role: 'state',
    },
    'isprating': {
        name: 'Some kind of rating',
        type: 'number',
        role: 'state',
    },
    'rating': {
        name: 'Another rating, which is always 0 it seems',
        type: 'number',
        role: 'state',
    },
    'ispdlavg': {
        name: 'Avg download speed by all users of this isp in Mbps',
        type: 'number',
        role: 'state',
        unit: 'Mb/s',
    },
    'ispulavg': {
        name: 'Avg upload speed by all users of this isp in Mbps',
        type: 'number',
        role: 'state',
        unit: 'Mb/s',
    },

    // Server details
    'url': {
        name: 'Test server URL',
        type: 'mixed',
        role: 'state',
    },
    'url2': {
        name: 'Test server URL',
        type: 'mixed',
        role: 'state',
    },
    'host': {
        name: 'Test server hostname',
        type: 'mixed',
        role: 'state',
    },
    'location': {
        name: 'Name of the location',
        type: 'mixed',
        role: 'state',
    },
    'name': {
        name: 'Name of the location',
        type: 'mixed',
        role: 'state',
    },
    'country': {
        name: 'Name of the country',
        type: 'mixed',
        role: 'state',
    },
    'cc': {
        name: 'Country code',
        type: 'mixed',
        role: 'state',
    },
    'sponsor': {
        name: 'Who pays for the test server',
        type: 'mixed',
        role: 'state',
    },
    'dist': {
        name: 'Distance from client to server (SI)',
        type: 'number',
        role: 'state',
        unit: 'km',
    },
    'distMi': {
        name: 'Distance from client to server (Imperial)',
        type: 'number',
        role: 'state',
        unit: 'mile',
    },
    'distance': {
        name: 'Distance from client to server (SI)',
        type: 'number',
        role: 'state',
        unit: 'km',
    },
    'distanceMi': {
        name: 'Distance from client to server (Imperial)',
        type: 'number',
        role: 'state',
        unit: 'mile',
    },
    'bestPing': {
        name: 'Best result to download a small file from the server, in ms',
        type: 'number',
        role: 'state',
        unit: 'ms',
    },
    'ping': {
        name: 'How long it took to download a small file from the server, in ms',
        type: 'number',
        role: 'state',
        unit: 'ms',
    },
    'id': {
        name: 'ID of the server',
        type: 'number',
        role: 'state',
    },
    'test_duration': {
        name: 'The maximum length (in ms) of a single test run (upload or download)',
        type: 'number',
        role: 'state',
        write: true,
        unit: 'seconds',
    },  
    'Last_Run_Timestamp': {
        name: 'Timestamp of last test-execution',
        type: 'number',
        role: 'value.time',
    },    
};

module.exports = state_attrb;