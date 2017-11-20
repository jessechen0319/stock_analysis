
class FetchDataCenter{

    constructor(){
        //init the utils
        this.ChainTask = require('task-chain').ChainTask;
        this.ChainTaskRunner = require('task-chain').ChainTaskRunner;
        this.jsonfile = require('jsonfile');
        this.GetRequestContent = require('./GetRequestContent');
    }

    _getDateBeforeDay(date, n){
        let targetDate = new Date(date.getTime()-(n*24*60*60*1000));
        return targetDate;
    }

    _getPeroid(peroid){
        let now = new Date();
        let beginDate = this._getDateBeforeDay(now, peroid);
        return {begin: beginDate.getTime(), end: now.getTime()};
    }

    fetchStockDetailAndAnylisys(anylisysor, callback){

        let stocks = this.jsonfile.readFileSync(__dirname+'/stocks.json');//get all stocks
        let peroidDaily = this._getPeroid(365);//get data within one year
        let peroid15min = this._getPeroid(40);
        let peroidWeekly = this._getPeroid(7*200);
        let chainTaskRunner = new this.ChainTaskRunner();
        stocks.forEach((stock, index)=>{
            let dailyUrl = `https://xueqiu.com/stock/forchartk/stocklist.json?symbol=${stock}&period=1day&type=before&begin=${peroidDaily.begin}&end=${peroidDaily.end}`;
            let m15Url = `https://xueqiu.com/stock/forchartk/stocklist.json?symbol=${stock}&period=15m&type=before&end=${peroid15min.end}&count=240`;
            let weeklyUrl = `https://xueqiu.com/stock/forchartk/stocklist.json?symbol=${stock}&period=1week&type=before&begin=${peroidWeekly.begin}&end=${peroidWeekly.end}`;
            
            //embed url
            let urls = [
                {url: dailyUrl, title:"daily"},
                {url: m15Url, title:"min_15"},
                {url: weeklyUrl, title:"weekly"}
            ];
            let task = new this.ChainTask(()=>{
                console.log(JSON.stringify(urls));
                this.GetRequestContent.downloadHttps(urls[0], (dataDaily)=>{
                    this.GetRequestContent.downloadHttps(urls[1], (data15Mins)=>{
                        this.GetRequestContent.downloadHttps(urls[2], (dataWeekly)=>{
                            let data = {
                                daily: dataDaily,
                                m15: data15Mins,
                                weekly: dataWeekly
                            };
                            console.log(data);
    
                            if(anylisysor.length>0){
                                anylisysor.call(this, data, stock);
                            }
    
                            setTimeout(()=>{
                                if(index == stocks.length-1){
                                    callback();
                                }
                                task.end();
                            }, 100);
                        });
                    });
                });
            });
            chainTaskRunner.addTask(task);
        });
    }

   

    fetchStockName(callback){
        let now = new Date();
        let nowValue = Date.parse(now);
        this.jsonfile.writeFileSync(__dirname+'/stocks.json', []);
        let kLineURL = `http://money.finance.sina.com.cn/d/api/openapi_proxy.php/?__s=[[%22hq%22,%22hs_a%22,%22%22,0,1,100]]&callback=analysisTitle`;
        this.GetRequestContent.download(kLineURL, (response)=>{
            eval(response);
        });
        let that = this;

        function analysisTitle(data){
            console.log(data[0].count);
            let urls = [];
            let maxPage = data[0].count/80 + 1;
            for(let i = 0; i< maxPage; i++){
                let URL = `http://money.finance.sina.com.cn/d/api/openapi_proxy.php/?__s=[[%22hq%22,%22hs_a%22,%22%22,${i},${i+1},80]]&callback=analysisEachPage`;
                urls.push(URL);
            }

            //fetch each pages after urls ready
            let ChainTaskRunner = require('task-chain').ChainTaskRunner;
            let ChainTask = require('task-chain').ChainTask;
            var taskRunner = new ChainTaskRunner();
            urls.forEach((url, index)=>{
                
                let chainTask = new ChainTask(()=>{
                    that.GetRequestContent.download(url, (response, error)=>{
                        if(error){
                            console.error(error);
                        } else {
                            eval(response);
                            if(index == urls.length-1){
                                callback(urls);
                            }
                        }
                        chainTask.end();
                    });
                });
                taskRunner.addTask(chainTask);
            });

            function analysisEachPage(data){
                var stocks = that.jsonfile.readFileSync(__dirname+'/stocks.json');
                if(!stocks){
                    stocks = [];
                }
                data[0].items.forEach((item)=>{
                    stocks.push(item[0]);
                });
                that.jsonfile.writeFileSync(__dirname+'/stocks.json', stocks);
            }
        }
    }

}

let fetch = new FetchDataCenter();
fetch.fetchStockName(()=>{
    fetch.fetchStockDetailAndAnylisys(()=>{
        console.log(end);
    });
});