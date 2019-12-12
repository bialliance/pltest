"use strict";
//  file pltest.js
//  performance and load testing tool for unb blochchain

const axios = require('axios');
const colors = require('colors');
const config = require('./config.json');

// parse argument list
const time = process.argv[2] || 1; // test duration in sec 
const speed = process.argv[3] || 1000; // tx speed in tps
const file = process.argv[4] || 'zero'; // tx speed in tps
const numTx = time * speed; //  total number of txs 

// calclulate burst paparmeters
let burstInterval;
let burst = 1;
if ( speed > 99 ) {
    burstInterval = 10;    //  burst interval in ms
    burst = speed / 100;  // number tx in burst
} else burstInterval = Math.round(1000 / speed, 0);

// load tx data from file
let tx = {};
if ( file == 'zero ') tx.data = ''
else {
    try {
        tx = require('./lib/' + file + '.json');
    } catch (err) {
        console.log(('Load tx data from ./lib/' + file + '.json' + err).yellow + (' Continue with zero tx data!').green);
        tx.data = '';
        file = 'zero';
    }
};

// calculate gas from tx data length
const gas = '0x' + (21000 + (tx.data.length > 1 ? tx.data.length - 2 : 0) * 34).toString(16);

console.log(('Load test starts for duration ' + time + ' sec.,  tx speed ' + speed + ' tps, and with ' + file + ' bytes tx data').green);

// init variables
let num = 0;
let numRes = 0;
let numErr = 0;
let done = false;
let timeTotal = 0;
let timeIn;
let timeIn1;

// init unit - tx object
let unit = {
    jsonrpc: '2.0',
    id: numRes + numErr,
    method: 'eth_sendTransaction',
    params: [{
        "from": config.from,
        "to": config.to,
        "gas": gas,
        "gasPrice": "0x0",
        "value": "0x0",
        "data": tx.data
    }],
};

// burstSend function declaration for async call
let burstSend = () => {
    timeIn = Date.now();
    for ( let n = 0; n < burst; n++) {
        num++;
        unit.id = num;
        axios.post(config.url, unit)
        .then(res => {
                numRes++;
                if ( num <= 10 ) console.log((numRes + ': ' + res.data.result).cyan);
        })
        .catch(err => {
            numErr++;
            console.log(('postUnb ' + num + ', ' + err).red);
        })
        .then(() => {
            if (numRes + numErr == 1) timeIn1 = Date.now(); // fix timestamp when first hash received 
            if ( done && (numRes + numErr == num) )  {
                let timeTotal1 = Date.now() - timeIn1;
                let speed = ( num * 1000 / timeTotal1).toFixed(0);
                console.log(('Hashs reseived: ' + numRes + ', errors: ' + numErr + ', total time2: ' + timeTotal1 + ' ms, tx load speed: ' + speed + ' tx/sec').green);
            };
        });
    };
    timeTotal += Date.now() - timeIn;
};

// burst sending loop 
let interval = setInterval( () => {
    if ( num >= numTx ) {
        console.log(('tx broadcasted: ' + num + ', total time1: ' + timeTotal + ' ms').green);
        done = true;
        clearInterval(interval);
        return;
    };
    burstSend();
}, burstInterval);
