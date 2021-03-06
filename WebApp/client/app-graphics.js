/*
    Extracted Graphics methods for main UI.
*/

(function(scope){
    // Check for namespace declaration
    if (!scope.VirtualAtm){
        scope.VirtualAtm = {};
    }

    var graphingService = function(host){
        var _host = host,
            _historyGraphsInitialized = false,
            _totalAmountGraph = null,
            _totalCountGraph = null,
            _graphsInitialized = false,
            _amountGraph = null,
            _countGraph = null,
            _alertGraph = null,
            _summaryDataBuffer = [],
            _summaryDataCounts = [],
            _maintenanceData = [];

        // Simple string formatting for large numbers
        var formatNumberShort = function(num){
            var asString = num.toFixed(0),
                len = asString.length;
            
            if ((len >= 1) && (len <= 3)) return asString;
            if ((len >= 4) && (len <= 6)) return (num / 1000).toFixed(0) + "K";
            if ((len >= 7) && (len <= 9)) return (num / 1000).toFixed(0) + "M";
        };

        //
        // Configures a lineplot using the specified options.
        //
        var createLinePlot = function(title, data, minDate, maxDate, domElm){
            return new Highcharts.Chart({
                chart: {
                    renderTo: domElm, 
                    type: 'line', 
                    animation: false,
                    backgroundColor: '#fff'
                },
                credits: { enabled: false },
                title: { text: null },
                plotOptions: {
                    column: { shadow: false },
                    spline: {
                        shadow: false,
                        marker: { radius: 0 }
                    },
                    line: {
                        marker: { radius: 0 }
                    },
                    series: { enableMouseTracking: true }
                },
                xAxis: { 
                    gridLineWidth: 1, 
                    type: 'datetime',
                    min: minDate,
                    max: maxDate
                },
                yAxis: {
                    title: { text: '' },
                    endOnTick: true,
                    labels: {
                        formatter: function () {
                            return this.value; // Disable label shortening
                        }
                    },
                    min: 0
                },
                legend: { enabled: false },
                series: [{ 
                    name: title,
                    animation: false,
                    color: '#69c', 
                    data: data
                }]
            });
        };

        //
        // Configures a column plot using the specified options.
        //
        var createColumnPlot = function(title, data, minDate, maxDate, domElm){
            return new Highcharts.Chart({
                chart: {
                    renderTo: domElm, 
                    type: 'column', 
                    animation: false,
                    backgroundColor: '#fff'
                },
                credits: { enabled: false },
                title: { text: null },
                xAxis: { 
                    gridLineWidth: 1, 
                    type: 'datetime',
                    min: minDate,
                    max: maxDate
                },
                yAxis: {
                    title: { text: '' },
                    endOnTick: true,
                    labels: {
                        formatter: function () {
                            return this.value; // Disable label shortening
                        }
                    }
                },
                legend: { enabled: false },
                series: [{ 
                    animation: false,
                    color: '#69c', 
                    data: data
                }]
            });
        };

        this.InitializeHistoryGraphs = function(){
            // Initialize amount and count line plots
            if (!_historyGraphsInitialized) {
                let maxDate = Date.now();
                let minDate = Date.now() - (14 * 86400 * 1000); // 2 weeks...for now
                _totalAmountGraph = createLinePlot('Total Purchase Amount', [], minDate, maxDate, 'totalAmountGraph');
                _totalCountGraph = createLinePlot('Total Purchase Count', [], minDate, maxDate, 'totalCountGraph');
                _historyGraphsInitialized = true;
            }

            // Force a chart reflow
            _totalAmountGraph.reflow();
            _totalCountGraph.reflow();
        };

        this.RenderHistoryGraphs = function(data){
            var amounts = [],
            counts = [],
            totalAmount = 0.0,
            totalCount = 0;

            data.map(function(datum){
                amounts.push([Date.parse(datum.date), datum.amount]);
                counts.push([Date.parse(datum.date), datum.count]);
                totalAmount += datum.amount;
                totalCount += datum.count;
            });

            // Set data on plot series
            _totalAmountGraph.series[0].setData(amounts);
            _totalCountGraph.series[0].setData(counts);

            // Update summary badges
            _host('#totalAmountGauge span.data').text(formatNumberShort(totalAmount));
            _host('#totalCountGauge span.data').text(formatNumberShort(totalCount));
        };

        this.InitializeLiveGraphs = function(){
            // Initialize amount and count line plots
            if (!_graphsInitialized) {
                let maxDate = Date.now() + (5 * 60 * 1000); // ~5 minute window
                let minDate = Date.now();
                _amountGraph = createLinePlot('Transaction Amounts', [], minDate, maxDate, 'amountGraph');
                _countGraph = createLinePlot('Transaction Counts', [], minDate, maxDate, 'countGraph');
                _alertGraph = createColumnPlot('Maintenance Alerts', [], minDate, maxDate, 'alertsGraph');

                // // set a timer to keep the x-axis rolling
                // setInterval(() => {
                //     let maxDate = Date.now() + (5 * 60 * 1000); // ~5 minute window
                //     let minDate = Date.now();
                //     _amountGraph.xAxis[0].setExtremes(minDate, maxDate);
                //     _countGraph.xAxis[0].setExtremes(minDate, maxDate);
                //     _alertGraph.xAxis[0].setExtremes(minDate, maxDate);
                // }, 1 * 60 * 1000);

                _graphsInitialized = true;
            }

            // Force a reflow 
            _amountGraph.reflow();
            _countGraph.reflow();
            _alertGraph.reflow();
        };

        this.RenderLiveGraphs = function(data){
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
        };

        this.UpdateLiveGraphs = function(txnDatum, alertDatum){
            if (txnDatum) {
                // Add new data values
                _summaryDataCounts.push([Date.parse(txnDatum.date), txnDatum.count]);
                _summaryDataBuffer.push([Date.parse(txnDatum.date), txnDatum.amount]);
                _maintenanceData.push(0);
            } else {
                _maintenanceData.push([Date.parse(alertDatum.date), alertDatum.count]);
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
                return prev + curr[1];
            }, 0);
            var countSum = _summaryDataCounts.reduce(function (prev, curr) {
                return prev + curr[1];
            }, 0);
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
    };

    //
    // Module exports
    //
    scope.VirtualAtm.GraphingServices = graphingService;
})(this);