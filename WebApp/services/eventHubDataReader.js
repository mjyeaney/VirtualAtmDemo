//
// This service is responsible for gathering up summarized data from blob storage
// for each metric output from Stream Analytics.
//

((scope) => {
    if (!scope.EventHubDataReader) {
        scope.EventHubDataReader = {};
    }

    const eventHubClient = require('azure-event-hubs').Client;
    const WINDOW_SIZE = 300;
    const CONN_STR_MAINTENANCE = process.env.VirtualAtmEventHubMaint;
    const CONN_STR_TXNSUMMARY = process.env.VirtualAtmEventHubTxn;

    const _beginEventHubListener = (connection, callback, localCacheProvider) => {
        const _client = eventHubClient.fromConnectionString(connection);
        
        _client.open().then(() => {
            return _client.getPartitionIds()
        }).then((ids) => {
            ids.map((id) => {
                _client.createReceiver('$Default', id, { 
                    startAfterTime: Date.now() 
                }).then((receiver) => {
                    receiver.on('errorReceived', (err) => {
                        console.log(`ERROR: ${err}`);
                    });
                    receiver.on('message', (message) => {
                        var bodyParts = message.body;
                        bodyParts.map((part) => {
                            localCacheProvider(part);
                            callback(part);
                        });
                    });
                });
            });
        });
    };

    const startMaintenanceListener = (callback) => {
        _beginEventHubListener(CONN_STR_MAINTENANCE, callback, (localCacheData) => {
            console.log("Updateing alert snapshot data cache...");
            scope.EventHubDataReader.MaintenanceSnapshot.push(localCacheData.count);

            console.log("Trimming alert snapshot data cache...");
            if (scope.EventHubDataReader.MaintenanceSnapshot.length > WINDOW_SIZE) {
                scope.EventHubDataReader.MaintenanceSnapshot.shift();
            }
        });
    };

    const startTxnSummaryListener = (callback) => {
        _beginEventHubListener(CONN_STR_TXNSUMMARY, callback, (localCacheData) => {
            console.log("Updating transaction snapshot data cache..")
            scope.EventHubDataReader.TxnSummarySnapshot.push(localCacheData.amount);
            scope.EventHubDataReader.TxnCountsSnapshot.push(localCacheData.count);
            scope.EventHubDataReader.MaintenanceSnapshot.push(0);

            console.log("Trimming transaction snapshot data caches...");
            if (scope.EventHubDataReader.TxnSummarySnapshot.length > WINDOW_SIZE) {
                scope.EventHubDataReader.TxnSummarySnapshot.shift();
            }
            if (scope.EventHubDataReader.TxnCountsSnapshot.length > WINDOW_SIZE) {
                scope.EventHubDataReader.TxnCountsSnapshot.shift();
            }
            if (scope.EventHubDataReader.MaintenanceSnapshot.length > WINDOW_SIZE) {
                scope.EventHubDataReader.MaintenanceSnapshot.shift();
            }
        });
    };

    scope.EventHubDataReader.StartMaintenanceListener = startMaintenanceListener;
    scope.EventHubDataReader.StartTxnSummaryListener = startTxnSummaryListener;
    scope.EventHubDataReader.TxnSummarySnapshot = [];
    scope.EventHubDataReader.TxnCountsSnapshot = [];
    scope.EventHubDataReader.MaintenanceSnapshot = [];
})(this);