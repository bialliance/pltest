"use strict";
//  file speed.js
//  speed test for unb pilot blochchain

const num = process.argv[2] || 1; // number of tx 
const speed = process.argv[3] || 1000; // speed in tx/sec
const averageInterval = 10;    //  interval in ms
const burst = speed / averageInterval;  // number request in burst

const url = ''
//const url = 'http://10.20.40.111:8081'
const from = '';
const to = from
//let Unit = require('.././models/unbtx');

let axios = require('axios');
let colors = require('colors');

//let mongoose = require('mongoose');
//mongoose.Promise = require('bluebird');

//Unit.remove({}, err => console.log('clear db ' + err));
let numRes = 0;
let numErr = 0;

// POST /unbtx tests 

let timeIn = Date.now();
let timeIn1 = timeIn;
console.log(('Speed test starts for ' + num + ' tx(s) with empty data').green);
let unit = {
    jsonrpc: '2.0',
    id: numRes + numErr,
    method: 'eth_sendTransaction',
    params: [{
        "from": from,
        "to": to,
        "gas": "0x5208",
        "gasPrice": "0x0",
        "value": "0x0",
        "data": ""
    }],
};
let i = 0;
let interval;
setTimeout( function send() {
    for ( let n = 0; n < burst; n++) {
        axios.post(url, unit)
        .then(res => {
                numRes++;
                if ( num <= 10 ) console.log((numRes + ': ' + res.data.result).cyan);
        })
        .catch(err => {
            numErr++;
            console.log(('postUnb ' + i + ', ' + err).red);
        })
        .then(() => {
            if (numRes + numErr == 1) timeIn1 = Date.now();
            if (numRes + numErr == num) {
                let timeTotal = Date.now() - timeIn1;
                let speed = ( num * 1000 / timeTotal).toFixed(0);
                console.log(('Hashs reseived: ' + numRes + ', errors: ' + numErr + ', total time2: ' + timeTotal + ' ms, tx load speed: ' + speed + ' tx/sec').green);
                clearTimeout(interval);
                return;
            };
        });
        i++;
    }
    interval = setTimeout(send, averageInterval);
    if ( i == num ) {
        let timeTotal = Date.now() - timeIn;
        console.log(('tx broadcasted: ' + num + ', total time1: ' + timeTotal + ' ms').cyan);
    };
},averageInterval);

