//
// Basic app module definition
//
(function (scope) {
    // Create our namespace container
    if (!scope.VirtualAtm) {
        scope.VirtualAtm = {};
    }

    var DataService = function(){
        //
        // Loads the historical data (last 24 hrs)
        //
        this.LoadHistoryData = function(callback){
            $.ajax({
                type: "GET",
                url: "/data/overview",
                contentType: "application/json; charset=utf-8",
                success: function(data){
                    if (callback) callback(data);
                },
                error: function(e){
                    var msg = `${e.status}: ${e.statusText}`;
                    console.log(msg);
                }
            });
        };

        //
        // Loads the initial state of the 'live' view (~last 5 mins).
        //
        this.LoadLiveSnapshotData = function(callback){
            $.ajax({
                type: "GET",
                url: "/data/snapshot",
                contentType: "application/json; charset=utf-8",
                success: function(data){
                    if (callback) callback(data);
                },
                error: function(e){
                    var msg = `${e.status}: ${e.statusText}`;
                    console.log(msg);
                }
            });
        };

        //
        // Dispatches a maintenance message to the specified device
        //
        this.SendMaintenanceRequest = function (device, maintType, callback) {
            $.ajax({
                type: "POST",
                url: `/c2d/${device}`,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                data: JSON.stringify({ maintenanceType: maintType }),
                success: function(data){
                    console.log(data);
                    if (callback) callback();
                },
                error: function(e){
                    var msg = `${e.status}: ${e.statusText}`;
                    console.log(msg);
                    if (callback) callback(msg);
                }
            });
        };

        //
        // Lodas the last known image reported from the card reader
        //
        this.LoadCardReaderImageInfo = function(callback){
            $.ajax({
                type: "GET",
                url: "/cardreaderimages/latest",
                contentType: "application/json; charset=utf-8",
                success: function(data){
                    if (callback) callback(null, data);
                },
                error: function(e){
                    var msg = `${e.status}: ${e.statusText}`;
                    console.log(msg);
                }
            });
        };
    };

    //
    // Scope exports
    //
    scope.VirtualAtm.DataService = DataService;
})(this);