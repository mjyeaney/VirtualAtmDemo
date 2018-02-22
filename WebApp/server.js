/* global process, __dirname */

//
// Main node entry point. This file will be automatically
// bootstrapped by the Azure runtime.
//

//
// Pull in libs and bootstrap express application
//
const express = require("express"),
    bodyParser = require("body-parser"),
    eventHubDataReader = require("./services/eventHubDataReader.js").EventHubDataReader,
    iotHubSender = require("./services/ioTHubSender.js").IoTHub,
    historicalDataReader = require("./services/historicalDataReader.js").HistoricalDataReader,
    cardReaderImages = require("./services/cardReaderImageStore.js").CardReaderImageStore;
    
// Init the express engine
const app = express();

// Init Socket.io engine
const http = require('http').Server(app);
const io = require('socket.io')(http);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
app.use(bodyParser.json())

// Check for the PORT env var from the azure host
const port = process.env.PORT || 8009;

//
// Enable basic static resource support
//
app.use(express.static(__dirname, {
    index : "default.html"
}));

//
// Helper fn to set no-cache headers
//
const setNoCache = function(res){
    res.append("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
};

//
// Setup known request handlers
//
app.get("/data/overview", (req, resp) =>{
    console.log("GET /data/overview...");
    setNoCache(resp);
    historicalDataReader.Load((err, result) => {
        if (err){
            resp.status(500).send(err);
        } else {
            resp.json(result);
        }
    });
});

app.get("/data/snapshot", (req, resp) => {
    console.log("GET /data/snapshot...");
    setNoCache(resp);
    resp.json({
        transactions: eventHubDataReader.TxnSummarySnapshot,
        counts: eventHubDataReader.TxnCountsSnapshot,
        alerts: eventHubDataReader.MaintenanceSnapshot
    });
});

app.get("/cardreaderimages/latest", (req, resp) => {
    console.log("GET /cardreaderimages/latest...");
    setNoCache(resp);
    resp.status(200).json(cardReaderImages.GetLatestImageInfo());
});

app.post("/c2d/:deviceId/", (req, resp) => {
    console.log("POST /c2d/")
    setNoCache(resp);
    iotHubSender.SendDeviceMessage(req.params.deviceId, req.body.maintenanceType, (err, response) => {
        if (err){
            resp.status(500).send(err);
        } else {
            resp.json(response);
        }
    });
});

//
// Init socket.io events
//
io.on('connection', function(socket){
    console.log('INFO: user connected');
    socket.on('disconnect', function(){
        console.log('INFO: user disconnected');
    });
});

console.log("INFO: Starting maintenance listener...");
eventHubDataReader.StartMaintenanceListener((data) => {
    io.emit('maintenancealert', data);
});

console.log("INFO: Staring transcation summary listener...");
eventHubDataReader.StartTxnSummaryListener((data) => {
    io.emit('txnsummarydata', data);
});

//
// Init server listener loop
//
const server = http.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log(`INFO: Server now listening at http://${host}:${port}`);
});
