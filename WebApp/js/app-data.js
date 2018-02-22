//
// Basic app module definition
//
(function (scope) {
    // Create our namespace container
    if (!scope.Application) {
        scope.Application = {};
    }

    var DataService = function(){
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
    scope.Application.DataService = DataService;
})(this);