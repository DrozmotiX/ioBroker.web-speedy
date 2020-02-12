![Logo](admin/web-speedy.png)
# ioBroker.web-speedy

[![NPM version](http://img.shields.io/npm/v/iobroker.web-speedy.svg)](https://www.npmjs.com/package/iobroker.web-speedy)
[![Downloads](https://img.shields.io/npm/dm/iobroker.web-speedy.svg)](https://www.npmjs.com/package/iobroker.web-speedy)
![Number of Installations (latest)](http://iobroker.live/badges/web-speedy-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/web-speedy-stable.svg)
[![Dependency Status](https://img.shields.io/david/iobroker-community-adapters/iobroker.web-speedy.svg)](https://david-dm.org/iobroker-community-adapters/iobroker.web-speedy)
[![Known Vulnerabilities](https://snyk.io/test/github/iobroker-community-adapters/ioBroker.web-speedy/badge.svg)](https://snyk.io/test/github/iobroker-community-adapters/ioBroker.web-speedy)

[![NPM](https://nodei.co/npm/iobroker.web-speedy.png?downloads=true)](https://nodei.co/npm/iobroker.web-speedy/)

**Tests:**: [![Travis-CI](http://img.shields.io/travis/iobroker-community-adapters/ioBroker.web-speedy/master.svg)](https://travis-ci.org/iobroker-community-adapters/ioBroker.web-speedy)

## web-speedy adapter for ioBroker

Web-Speedy enables you to test your internet connection on a regular base and store results in ioBroker !

### How to use this adapter 

At first startup it will retrieve best-servers nearby based on ping results and run the first test.

Web-Speedy is build in a way all execution is handled automatically, meaning you don't have a configuration page.
However, you still can influance some things (see datapoints):

- [test_auto_intervallIntervall]	Intervall time for automated test-execution (default = 60, if set to 0 no automated test will run !)
- [test_best]						Run test now on best-server based on last ping results
- [test_specific]					Use the dropdown list to choose one of the top 5 servers found in previous scan

## Support me
If you like my work, please feel free to provide a personal donation  
(this is an personal Donate link for DutchmanNL, no relation to the ioBroker Project !)  
[![Donate](https://raw.githubusercontent.com/iobroker-community-adapters/ioBroker.wled/master/admin/button.png)](http://paypal.me/DutchmanNL)

## Changelog

### 0.1.0
* (DutchmanNL) Beta release for public testing

## License
MIT License

Copyright (c) 2020 DutchmanNL <rdrozda86@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.