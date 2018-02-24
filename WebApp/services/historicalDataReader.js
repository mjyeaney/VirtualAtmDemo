// 
// Provides a cached view of the historical data (cold path) feed 
//

((scope) => {
    if (!scope.HistoricalDataReader){
        scope.HistoricalDataReader = {};
    }

    const https = require("https"),
        url = require("url"),
        parseXmlString = require("xml2js").parseString;

    const pool = new https.Agent({ keepAlive: true });

    let _cachedData = null,
        _cacheTimer = null;

    const parseBlobContents = (parsedUrl, workItemIndex, fullBody, callback) => {
        console.log(`Blob ${parsedUrl.path} downloaded..parsing`);
        let splitPath = parsedUrl.path.split("/");
        let dateParts = `${splitPath[2]}-${splitPath[3]}-${splitPath[4]} ${splitPath[5]}:00:00`;
        let rows = fullBody.split("\n").slice(1); // NOTE: skip the header row of the CSV
        let summedAmount = 0.0;
        let summedCount = 0;

        rows.map((row) => {
            if (row.length > 0){
                let cells = row.split(",");
                if (cells.length > 0){
                    summedAmount += parseFloat(cells[2]);
                    summedCount += parseInt(cells[3]);
                }
            }
        });

        console.log(`Parsing complete for ${parsedUrl.path}`);
        callback(null, workItemIndex, {
            date: dateParts,
            amount: summedAmount,
            count: summedCount
        });
    };

    const downloadBlob = (blobUrl, workItemIndex, callback) => {
        let parsedUrl = url.parse(blobUrl);
        https.get({
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            agent: pool,
            method: "GET"
        }, (resp) => {
            let fullBody = "";
            resp.on("data", (part) => {
                fullBody += part;
            });
            resp.on("end", () => {
                parseBlobContents(parsedUrl, workItemIndex, fullBody, callback);
            });
        }).on("error", (err) => {
            console.log("Error [historicalDataReader::downloadBlob]: " + err.message);
        }).end();
    };

    // Parses the return XML from Blob store that lists individual blobs
    const parseBlobListResponse = (body, callback) => {
        console.log("Loaded blob container search results...enumerating");

        // The blob service returns XML (odata) for query results. Yay
        parseXmlString(body, (err, result) => {
            let blobCount = result.EnumerationResults.Blobs[0].Blob.length;
            let completedJobs = 0;
            let results = [];

            console.log(`Found ${blobCount} blobs...`);
            for (let j = 0; j < blobCount; j++){
                let blobUrl = result.EnumerationResults.Blobs[0].Blob[j].Url[0];

                // Download each blob async
                downloadBlob(blobUrl, j, (err, index, result) => {
                    results[index] = result;
                    completedJobs++;

                    // Basically "task.whenall", using bakery-style counters.
                    if (completedJobs === blobCount){
                        console.log("Sorting historical data...");
                        results.sort((a, b) => {
                            if (a.date > b.date) return 1;
                            if (a.date < b.date) return -1;
                            return 0;
                        });
                        console.log("Done sorting...results");
                        callback(results);
                    }
                });
            }
        })
    };

    // Search for blobs matching the current query (assumes only one)
    const listBlobsAndSummarize = (callback) => {
        let blobServiceUri = "https://virtualatmdemo02062018.blob.core.windows.net", 
            container = "vatmdemocoldpath",
            now = new Date();

        // Build search URL (see storage REST API docs)
        let searchUrl = `${blobServiceUri}/${container}?restype=container&comp=list`;
        let parsedUrl = url.parse(searchUrl);

        https.get({
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            agent: pool,
            method: "GET"
        }, (resp) => {
            let body = "";
            resp.on("data", (part) => {
                body += part;
            });
            resp.on("end", () => {
                parseBlobListResponse(body, callback);
            });
        }).on("error", (err) => {
            console.log("Error [historicalDataReader::listRecentBlobs]: " + err.message);
        }).end();
    };

    // Main cache / data workflow
    const loadData = function(callback){
        if (_cachedData == null){
            console.log("Cache miss...loading historical data...");

            listBlobsAndSummarize((results) => {
                console.log("Historical data loaded..setting cache timer");
                _cachedData = results;
                callback(null, results);

                _cacheTimer = setTimeout(() => {
                    console.log("Historical cache evicted!!!");
                    _cachedData = null;
                }, 2.5 * 60 * 1000); // Cache historical data for ~2.5 mins.
            });
        } else {
            console.log("Cache hit - returning historical data cache");
            callback(null, _cachedData);
        }
    };

    scope.HistoricalDataReader.Load = loadData;
})(this);