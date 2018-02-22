/*
    Basic Virtual ATM agent for sending random transactions to IoT hub
*/

'use strict';

// Pull in appropriate libraries
const clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString,
    Message = require('azure-iot-device').Message,
    moment = require('moment');

//
// Initialize the event hub connection object
//
const connectionString = process.env.VirtualAtmBulkAtmAgent;
const client = clientFromConnectionString(connectionString);

//
// Causes our device to upload a pice of telemetry
//
const sendReadingData = () => {
    // Create transaction message, representing a random withdrawal of
    // up to $300.00
    let deviceMessage = {
        condition: "OK",
        amount: (Math.random() * 300).toFixed(2),
        terminal: "BulkAtmAgent",
        time: moment().toISOString()
    };

    // Send message
    let data = JSON.stringify(deviceMessage);
    let message = new Message(data);
    client.sendEvent(message, (err, res) => {
        if (err) console.log(`ERROR: ${err.toString()}`);
        if (res) console.log(`RESPONSE: ${res.constructor.name}`);
    });

    console.log(`SENT: ${data}`);
    scheduleReading();
};

const sendMaintenanceAlert = () => {
    // Create maintenance message
    let deviceMessage = {
        condition: "MAINTENANCE_REQUIRED",
        terminal: "BulkAtmAgent",
        time: moment().toISOString()
    };

    // Send message
    let data = JSON.stringify(deviceMessage);
    let message = new Message(data);
    client.sendEvent(message, (err, res) => {
        if (err) console.log(`ERROR: ${err.toString()}`);
        if (res) console.log(`RESPONSE: ${res.constructor.name}`);
    });

    console.log(`SENT: ${data}`);
    scheduleReading();
};

const scheduleReading = () => {
    setTimeout(() => {
        if (Math.random() > .95){
            sendMaintenanceAlert();
        } else {
            sendReadingData();
        }
    }, (Math.random() * 1500));
};

const printMaintenanceMessage = (msg) => {
    console.log();
    console.log("**************************************************************");
    console.log("MAINTENANCE ALERT")
    console.log();
    console.log("Performaning requested maintenance")
    console.log();
    console.log(msg);
    console.log();
    console.log("COMPLETE!");
    console.log("**************************************************************");
    console.log();
};

const connectCallback = (err) => {
    if (err) {
        console.log("ERROR: Could not connect: " + err);
    } else {
        console.log("INFO: Connected!!!");

        // Setup simple handler for cloud-to-device messages
        client.on('message', (msg) => {
            printMaintenanceMessage('Id: ' + msg.messageId + ' Body: ' + msg.data);
            client.complete(msg, (err, resp) => {
                if (err) console.log(`ERROR: ${err.toString()}`);
                if (resp) console.log(`CLOUD-INFO: ${resp.constructor.name}`);
            });
        });

        // Schedule random ATM events
        scheduleReading();
    }
};

// Open the connection to the IoT hub
console.log("INFO: Bootstrapping IoT Hub connection...");
client.open(connectCallback);

// Block process from exiting since everything is async
process.stdin.resume();