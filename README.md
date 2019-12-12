# pltest
pltest - performance and load testing tool for UNB client. Written on NodeJS, requires axios, colors, ws.

Usage:
node pltest param1 param2 param3,
param1 - duration of test in seconds, default 1 sec. 
param2 - speed of transactions in tps (transactions per second), default 1000 tps.
param3 - name of json file in folder ./lib with transaction data, default - zero (zero tx data).  

Examples:

node pltest - will runs test with duration 1 second, tx speed 1000 tps and with zero tx data.

node pltest 100 5000 1000 - will runs test for 100 seconds, tx speed 5000 tps and tx data from file ./lib/1000.json (1k tx data).