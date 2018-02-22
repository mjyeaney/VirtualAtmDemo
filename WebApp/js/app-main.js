//
// Basic app module definition
//
(function (scope) {
    // Create our namespace container
    if (!scope.Application) {
        scope.Application = {};
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // Application Controller
    //

    var Controller = function () {
        var _self = this,
            _dataProvider = null,
            _host = null,
            _socket = null,
            _historyGraphsInitialized = false,
            _totalAmountGraph = null,
            _totalCountGraph = null,
            _graphsInitialized = false,
            _photoRefreshTimer = null,
            _amountGraph = null,
            _countGraph = null,
            _alertGraph = null,
            _summaryDataBuffer = [],
            _summaryDataCounts = [],
            _maintenanceData = [];

        var formatNumberShort = function(num){
            var asString = num.toFixed(0),
                len = asString.length;
            
            if ((len >= 1) && (len <= 3)) return asString;
            if ((len >= 4) && (len <= 6)) return (num / 1000).toFixed(0) + "K";
            if ((len >= 7) && (len <= 9)) return (num / 1000).toFixed(0) + "M";
        };

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

            // Initialize amount and count line plots
            if (!_historyGraphsInitialized) {
                _totalAmountGraph = Graphics.CreateLinePlot('Withdrawal Amounts', [], 'totalAmountGraph');
                _totalCountGraph = Graphics.CreateLinePlot('Withdrawal Counts', [], 'totalCountGraph');
                _historyGraphsInitialized = true;
            }

            // Force a chart reflow
            _totalAmountGraph.reflow();
            _totalCountGraph.reflow();

            // Load baseline data
            _dataProvider.LoadHistoryData(function(data){
                var amounts = [],
                    counts = [],
                    totalAmount = 0.0,
                    totalCount = 0;

                data.map(function(datum){
                    amounts.push(datum.amount);
                    counts.push(datum.count);
                    totalAmount += datum.amount;
                    totalCount += datum.count;
                });

                // Set data on plot series
                _totalAmountGraph.series[0].setData(amounts);
                _totalCountGraph.series[0].setData(counts);

                // Update summary badges
                _host('#totalAmountGauge span.data').text(formatNumberShort(totalAmount));
                _host('#totalCountGauge span.data').text(formatNumberShort(totalCount));
            });
        };
        
        var displayLiveView = function () {
            // Adjust UI state
            _host('#content .content-stage').hide();
            _host('#content #dashboard').show();
            _host('#navigation li a').removeClass('active');
            _host('#navigation li a.liveview').addClass('active');

            // Initialize amount and count line plots
            if (!_graphsInitialized) {
                _amountGraph = Graphics.CreateLinePlot('Transaction Amounts', [], 'amountGraph');
                _countGraph = Graphics.CreateLinePlot('Transaction Counts', [], 'countGraph');
                _alertGraph = Graphics.CreateColumnPlot('Maintenance Alerts', [], 'alertsGraph');
                _graphsInitialized = true;
            }

            // Force a reflow 
            _amountGraph.reflow();
            _countGraph.reflow();
            _alertGraph.reflow();

            // Load baseline data
            _dataProvider.LoadLiveSnapshotData(function(data){
                _summaryDataBuffer = data.transactions;
                _summaryDataCounts = data.counts;
                _maintenanceData = data.alerts;
                _amountGraph.series[0].setData(_summaryDataBuffer);
                _countGraph.series[0].setData(_summaryDataCounts);
                _alertGraph.series[0].setData(_maintenanceData);

                // Compute avgs for current buffers (need to fold over current buffers)
                var amountSum = _summaryDataBuffer.reduce(function (prev, curr) {
                    return prev + curr;
                }, 0.0);
                var countSum = _summaryDataCounts.reduce(function (prev, curr) {
                    return prev + curr;
                }, 0.0);
                var maintCount = _maintenanceData.reduce(function (prev, curr) {
                    return prev + curr;
                }, 0);
                var avgAmount = (amountSum === 0.0) ? 0.0 : (amountSum / countSum);

                // Update summary badges
                _host('#spendGauge span.data').text(avgAmount.toFixed(2));
                _host('#rateGauge span.data').text(countSum);
                _host('#alertRateGauge span.data').text(maintCount);
            });
        };

        var displayMaintenance = function () {
            _host('#content .content-stage').hide();
            _host('#content #mainenance').show();
            _host('#navigation li a').removeClass('active');
            _host('#navigation li a.maintenance').addClass('active');

            if (!_photoRefreshTimer){
                _photoRefreshTimer = setInterval(() => {
                    _dataProvider.LoadCardReaderImageInfo(function(err, data){
                        _host('#cardReaderImage').attr("src", data.blobUri);
                    });
                }, 5000);
            }
        };

        // Renders received data to the overview
        var updateLiveData = function (summaryData, maintenanceData) {
            if (summaryData) {
                // Add new data values
                _summaryDataCounts.push(summaryData.count);
                _summaryDataBuffer.push(summaryData.amount);
                _maintenanceData.push(0);
            } else {
                _maintenanceData.push(maintenanceData.count);
            }

            // Apply LIFO clamping
            if (_summaryDataBuffer.length > 300) {
                _summaryDataBuffer.shift();
            }
            if (_summaryDataCounts.length > 300) {
                _summaryDataCounts.shift();
            }
            if (_maintenanceData.length > 300) {
                _maintenanceData.shift();
            }

            // Compute avgs for current buffers (need to fold over current buffers)
            var amountSum = _summaryDataBuffer.reduce(function (prev, curr) {
                return prev + curr;
            });
            var countSum = _summaryDataCounts.reduce(function (prev, curr) {
                return prev + curr;
            });
            var maintCount = _maintenanceData.reduce(function (prev, curr) {
                return prev + curr;
            });
            var avgAmount = amountSum / countSum;

            // Set data on plot series
            _amountGraph.series[0].setData(_summaryDataBuffer, true, false, false);
            _countGraph.series[0].setData(_summaryDataCounts, true, false, false);
            _alertGraph.series[0].setData(_maintenanceData, true, false, false);

            // Update summary badges
            _host('#spendGauge span.data').text(avgAmount.toFixed(2));
            _host('#rateGauge span.data').text(countSum);
            _host('#alertRateGauge span.data').text(maintCount);
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
        this.BindHostEvents = function (host, socket) {
            _host = host;
            _socket = socket;

            $(window).bind("hashchange", function(e) { 
                routeCurrentLocation();
            });

            // Maintenance form button
            host('#btnMaintenance').click(function () {
                var device = host('#maintenanceDevice').val();
                var maintType = host('#maintenanceType').val();
                _dataProvider.SendMaintenanceRequest(device, maintType);
            })

            // Setup websocket events
            _socket.on('txnsummarydata', function (msg) {
                updateLiveData(msg, null);
            });
            _socket.on('maintenancealert', function (msg) {
                updateLiveData(null, msg);
            });
        };

        // Bootstrap default state
        this.Init = function (dataService) {
            _dataProvider = dataService;
            routeCurrentLocation();
        };
    };

    //
    // Scope exports
    //
    scope.Application.Controller = Controller;
})(this);
