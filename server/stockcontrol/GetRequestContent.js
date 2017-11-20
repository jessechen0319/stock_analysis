/**
 * Created by jesse on 2017/6/5.
 */
var http = require("http");
var https = require("https");
var iconv = require('iconv-lite'); 
var BufferHelper = require('bufferhelper');
//,,,


//....

// Utility function that downloads a URL and invokes
// callback with the data.
function download(url, callback) {
    http.get(url, function(res) {
        var data = "";
        var bufferHelper = new BufferHelper();
        res.on('data', function (chunk) {
            bufferHelper.concat(chunk);
        });
        res.on("end", function() {
            callback(iconv.decode(bufferHelper.toBuffer(),'GBK'));
        });
    }).on("error", function(error) {
        callback(null, error);
    });
}

function downloadHttps(url, callback) {
    https.get(url, function(res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on("end", function() {
            callback(data);
        });
    }).on("error", function(error) {
        callback(null, error);
    });
}

exports.download = download;
exports.downloadHttps = downloadHttps;

downloadHttps('https://xueqiu.com/stock/forchartk/stocklist.json?symbol=SZ000725&period=1day&type=before&begin=1479656167153&end=1511192167153', (data)=>{
    console.log(data);
});



