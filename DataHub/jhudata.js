const https = require('https'),
    vm = require('vm'),
    concat = require('concat-stream'); // this is just a helper to receive the
// http payload in a single callback
// see https://www.npmjs.com/package/concat-stream
const parse = require('csv-parse/lib/sync')
const fs = require('fs');

const storeData = (path, data) => {
  try {
    fs.writeFileSync(path, data)
  } catch (err) {
    console.error('err')
  }
}

const loadData = (path) => {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch (err) {
    console.error(err)
    return false
  }
}

const processCSVData = function(data, cols){
    const records = parse(data, {
        // columns: true,
        skip_empty_lines: true
    })


    const sumArr = (a, b) =>{
        if (!a) return b.map(e=>parseInt(e));
        if (a.length != b.length) return false;
        return a.map( (v, i) => v + parseInt(b[i]));
    }

    let hist = {};
    let lock = {};

    let dates = records[0].slice(cols[2]);
    for (let i=1; i< records.length; i++){
        const r = records[i];
        if (r[cols[0]].length==0){
            hist[r[cols[1]]] = r.slice(cols[2]).map(e=>parseInt(e));
            lock[r[cols[1]]] = true;
        } else if (! lock[r[cols[1]]] && r[cols[0]] != 'Unassigned'){
            // if (r[cols[1]] == 'New Jersey') console.log(r[cols[0]])
            hist[r[cols[1]]] = sumArr(hist[r[cols[1]]], r.slice(cols[2]));
        }
    }
    return {dates, hist}
}

const baseURL = `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_#TYPE#.csv`;

// array a[0]: subregion column, a[1]: region column, a[2]: starting column of the data
const dataType = {
    confirmed_global: [0, 1, 4],
    deaths_global: [0, 1, 4],
    confirmed_US: [5, 6, 12],
    deaths_US: [5, 6, 12],
}


let historyAll = {}

let getURLData = function(){
    for (const t in dataType){
        const url = baseURL.replace('#TYPE#', t);
        https.get(url, function (res, type=t) {
            res.setEncoding('utf8');
            res.pipe(concat({
                encoding: 'string'
            }, function (data) {
                historyAll[type] = processCSVData(data, dataType[type]);
                console.log(type + ' updated')
                if (Object.keys(historyAll).length == Object.keys(dataType).length){
                    storeData(__dirname +`/jhudata.json`, JSON.stringify(historyAll));
                }
            }));
        }).on('error', function (e) {
            console.log("Got error: " + e.message);
        });

    }
};

// historyAll = JSON.parse(loadData(__dirname +`/jhudata.json`));


exports.updateURLData = function(){
    getURLData();
}

exports.getData = function(){
    return historyAll;
}

getURLData();
setInterval(getURLData, 2*3600*1000)


