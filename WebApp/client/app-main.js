//
// Basic app module definition
//
(function (scope) {
    // Create our namespace container
    if (!scope.VirtualAtm) {
        scope.VirtualAtm = {};
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Application Controller
    //

    var controller = function (dataProvider, graphingProvider) {
        var _self = this,
            _dataProvider = dataProvider,
            _graphingProvider = graphingProvider,
            _host = null,
            _socket = null,
            _photoRefreshTimer = null;

        var displayOverview = function () {
            _host('#content .content-stage').hide();
            _host('#content #overview').show();
            _host('#navigation li a').removeClass('active');
            _host('#navigation li a.overview').addClass('active');
        };

        var displayHistory = function(){
            _host('#content .content-stage').hide();
            _host('#content #history').show();
            _host('#navigation li a').removeClass('active');
            _host('#navigation li a.history').addClass('active');
            _graphingProvider.InitializeHistoryGraphs();

            // Load baseline data
            _dataProvider.LoadHistoryData(function(data){
                _graphingProvider.RenderHistoryGraphs(data);
            });
        };
        
        var displayLiveView = function () {
            // Adjust UI state
            _host('#content .content-stage').hide();
            _host('#content #dashboard').show();
            _host('#navigation li a').removeClass('active');
            _host('#navigation li a.liveview').addClass('active');
            _graphingProvider.InitializeLiveGraphs();

            // Load baseline data
            _dataProvider.LoadLiveSnapshotData(function(data){
                _graphingProvider.RenderLiveGraphs(data);
            });
        };

        var displayMaintenance = function () {
            _host('#content .content-stage').hide();
            _host('#content #mainenance').show();
            _host('#navigation li a').removeClass('active');
            _host('#navigation li a.maintenance').addClass('active');

            if (!_photoRefreshTimer){
                var refreshCardReaderPhoto = function(){
                    _dataProvider.LoadCardReaderImageInfo(function(err, data){
                        if (data !== null){
                            _host('#cardReaderImage').attr("src", data.blobUri);
                        } else {
                            _host('#cardReaderImage').attr("src", "/images/loading.gif");
                        }
                    });
                };

                refreshCardReaderPhoto();

                _photoRefreshTimer = setInterval(() => {
                    refreshCardReaderPhoto();
                }, 5000);
            }
        };

        var updateLiveData = function (txnDatum, alertDatum) {
            _graphingProvider.UpdateLiveGraphs(txnDatum, alertDatum);
        };

        var routeCurrentLocation = function(){
            switch (location.hash){
                case '#/overview':
                case '':
                    displayOverview();
                    break;
                case '#/history':
                    displayHistory();
                    break;
                case '#/liveview':
                    displayLiveView();
                    break;
                case '#/maintenance':
                    displayMaintenance();
                    break;
            }
        };

        // Binds controller actions to host (DOM) events
        this.BindHost = function (host, socket) {
            _host = host;
            _socket = socket;

            $(window).bind("hashchange", function(e) { 
                routeCurrentLocation();
            });

            // Maintenance form button
            _host('#btnMaintenance').click(function () {
                var device = _host('#maintenanceDevice').val();
                var maintType = _host('#maintenanceType').val();
                _dataProvider.SendMaintenanceRequest(device, maintType);
            })

            // Setup websocket events
            _socket.on('txnsummarydata', function (msg) {
                updateLiveData(msg, null);
            });
            _socket.on('maintenancealert', function (msg) {
                updateLiveData(null, msg);
            });

            // Ensure current state is routed (based on URL, history, etc)
            routeCurrentLocation();
        };
    };

    //
    // Scope exports
    //
    scope.VirtualAtm.Controller = controller;
})(this);
