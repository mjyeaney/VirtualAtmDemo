/*
    Extracted Graphics methods for main UI.
*/

(function(scope){
    // Check for namespace declaration
    if (!scope.Graphics){
        scope.Graphics = {};
    }

    //
    // Configures a lineplot using the specified options.
    //
    var createDateTimeLinePlot = function(title, data, minDate, maxDate, domElm){
        return new Highcharts.Chart({
            chart: {
                renderTo: domElm, 
                type: 'spline', 
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
                series: { enableMouseTracking: false }
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
                animation: false,
                color: '#69c', 
                data: data
            }]
        });
    };

    //
    // Configures a column plot using the specified options.
    //
    var createColumnPlot = function(title, data, domElm){
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
                min: Date.now() - (10 * 60 * 1000),
                max: Date.now()
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

    //
    // Module exports
    //
    scope.Graphics.CreateDateTimeLinePlot = createDateTimeLinePlot;
    scope.Graphics.CreateColumnPlot = createColumnPlot;
})(this);