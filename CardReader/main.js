//
// This short inteface reads keyboard input from the /dev/input/eventX
// streams. Keyboard keycodes are mapped through a short map, and the number is
// is extracted just for demo purposes.
// 
// Once a full number is read, a short telemetry message is sent to IoT hub, as well as
// the custom health check endpoint.
//

const inputevent = require("input-event"),
    clientFromConnectionString = require('azure-iot-device-mqtt').clientFromConnectionString,
    Message = require('azure-iot-device').Message,
    moment = require('moment'),
    webcam = require('node-webcam'),
    fs = require("fs");

const input = new inputevent('/dev/input/event0');
const keyboard = new inputevent.Keyboard(input);

// This is our short keycode map
const keyMap = "X^1234567890XXXXqwertyuiopXXXXasdfghjklXXXXXzxcvbnmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

// Initialize the IOT hub connection 
const connectionString = process.env.VirtualAtmCardReader;
const client = clientFromConnectionString(connectionString);

// Raw input buffers
let buffer = [];
let codeBuffer = [];

// Initialize webcam options
let opts = {
    width: 640,
    height: 320,
    quality: 75,
    delay: 0,
    saveShots: false,
    output: "jpeg",
    device: false,
    callbackReturn: "location",
    device: false
};
let camera = webcam.create(opts);

//
// Send a reading to the IOT hub
//
const sendReadingData = () => {
    // Create transaction message, representing a withdrawal of
    // $3000.00
    let deviceMessage = {
        condition: "OK",
        amount: 3000.00,
        terminal: "PiCardReader",
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
};

const captureAndSendPhoto = () => {
    let imageName = `images/${Date.now()}`;
    camera.capture(imageName, (err, data) => {
        console.log(`Capture image to: ${data}`);
        fs.stat(data, (err, stats) => {
            const rs = fs.createReadStream(data);
            client.uploadToBlob(data, rs, stats.size, (err) => {
                if (err) { 
                    console.log(`Error uploading image: ${err.toString()}`);
                } else {
                    console.log("Image upload finished!");
                    fs.unlink(data, (err) => {
                        if (err) {
                            console.log(`Error removing temp image file: ${err.toString()}`);
                        }
                    });
                }
            });
        });
    });
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
    }
};

// Bind to the kernel event messages
keyboard.on("keypress", (data) => {
    // Numeric 'enter' key marks end of this read
    if (data.code === 96){
        let fullCode = buffer.join('');
        let cardNumber = fullCode.substring(2, 18);
        buffer.length = 0;
        codeBuffer.length = 0;
        console.log(`Read number: ${cardNumber}`);
        sendReadingData();
        captureAndSendPhoto();
        return;
    }

    // Classic EBCDIC encoding on alpha characters (\x42 is a period)
    // Just ignoring for this demo
    if (data.code != 42) {
        buffer.push(keyMap[data.code]);
        codeBuffer.push(data.code);
    }
});

// Open the connection to the IoT hub
console.log("INFO: Bootstrapping IoT Hub connection...");
client.open(connectCallback);
