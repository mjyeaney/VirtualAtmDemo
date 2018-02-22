//
// IoT Hub interface library for management plane operations, as
// well as C2D messaging.
//

((scope) => {
    if (!scope.IoTHub) {
        scope.IoTHub = {};
    }

    const connectionString = process.env.VirtualAtmIotHubOwner;
    
    let Client = require('azure-iothub').Client;
    let Message = require('azure-iot-common').Message;
    let cardReaderImageStore = require("./cardReaderImageStore.js").CardReaderImageStore;
    let serviceClient = Client.fromConnectionString(connectionString);

    let getResultFor = (op, callback) => {
        return function printResult(err, res) {
            if (err) callback(op + ' error: ' + err.toString());
            if (res) callback(null, op + ' status: ' + res.constructor.name);
        };
    };

    const sendC2Dmessage = (deviceId, payload, callback) => {
        serviceClient.open((err) => {
            if (err) {
                callback('Could not connect: ' + err.message);
            } else {
                console.log('Service client connected');
                var message = new Message(payload);
                message.messageId = Date.now().toString();
                console.log('Sending message: ' + message.getData());
                serviceClient.send(deviceId, message, getResultFor('send', callback));
            }
        });
    };

    serviceClient.open((err) => {
        if (err) {
            console.log(`Could not connect to IoT Hub: ${err.message}`);
        } else {
            serviceClient.getFileNotificationReceiver((err, receiver) => {
                if (err) {
                    console.error('error getting the file notification receiver: ' + err.toString());
                } else {
                    receiver.on('message', function (msg) {
                        console.log('File upload notification received...')
                        cardReaderImageStore.UpdateLatestImageInfo(JSON.parse(msg.getData().toString("utf-8")));
                    });
                }
            });
        }
    });

    scope.IoTHub.SendDeviceMessage = sendC2Dmessage;
})(this);