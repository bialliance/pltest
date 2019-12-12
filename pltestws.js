"use strict";
//  file pltestws.js
//  performance and load testing tool for unb client (websocket)

const WebSocket = require('ws');
const colors = require('colors');
const config = require('./config.json');

// parse argument list
const time = process.argv[2] || 1; // test duration in sec 
const speed = process.argv[3] || 1; // tx speed in tps
const file = process.argv[4] || 'zero'; // tx speed in tps
const numTx = time * speed; //  total number of txs 

// calclulate burst paparmeters
let burstInterval;
let burst = 1;
if ( speed > 99 ) {
    burstInterval = 100;    //  burst interval in ms
    burst = speed / 10;  // number tx in burst
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

// init unit - tx object
let unit = {
    "id": 0,
    "method": "eth_sendTransaction",
    "params": [{
        "from": config.from,
        "to": config.to,
        "gas": gas,
        "gasPrice": "0x0",
        "value": "0x0",
        "data": tx.data
    }],
};

// init variables
let num = 0;
let numRes = 0;
let numErr = 0;
let done = false;
let timeTotal = 0;
let timeIn;
let timeIn1;

// burstSend function declaration for async call
let burstSend = _ws => {
    timeIn = Date.now();
    for ( let n = 0; n < burst; n++) {
        num++;
        unit.id = num;
        _ws.send(JSON.stringify(unit));
    };
    timeTotal += Date.now() - timeIn;
};

let ws = startWs(config.ws);
// burst sending loop 
let interval = setInterval( () => {
    if ( num >= numTx ) {
        console.log(('tx broadcasted: ' + num + ', total time1: ' + timeTotal + ' ms').green);
        done = true;
        clearInterval(interval);
        return;
    };
    burstSend(ws);
}, burstInterval);

function startWs(wsUrl) {
    let ws = new WebSocket(wsUrl);
    ws.on('open', () => {
            console.log('websocket connected on ' + config.ws);
    });
    ws.on('message', res => {
        numRes++;
        if ( numTx <= 10 ) console.log((numRes + ': ' + res).cyan);
        check(numErr, numRes);
    });
    ws.on('close', () => {
            console.log('websocket disconnected');
    });
    ws.on('error', err => {
        numErr++;
        console.log((num + ' websocket ' + err).red);
        check(numErr, numRes);
    });
    return ws;
};    

function check(numE, numR) {
    if (numR + numE == 1) timeIn1 = Date.now(); // fix timestamp when first hash received 
    if ( numR + numE == numTx )  {
        let timeTotal1 = Date.now() - timeIn1;
        let speed = ( num * 1000 / timeTotal1).toFixed(0);
        console.log(('Hashs reseived: ' + numR + ', errors: ' + numE + ', total tx load time: ' + timeTotal1 + ' ms, tx load speed: ' + speed + ' tx/sec').green);
        ws.terminate();
    };    
};