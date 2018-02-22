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
    var createLinePlot = function(title, data, domElm){
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
                series: { enableMouseTracking: false }
            },
            xAxis: { 
                gridLineWidth: 1, 
                type: 'linear',
                min: 0,
                max: 300
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
                type: 'linear',
                min: 0,
                max: 300
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
    scope.Graphics.CreateLinePlot = createLinePlot;
    scope.Graphics.CreateColumnPlot = createColumnPlot;
})(this);