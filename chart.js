const express = require('express');
const app = express();
const dataHub = require('./DataHub/jhudata.js')


app.get('/updatedata', function(req, res) {
    console.log('update');
    dataHub.updateUrlData();
    res.send('ok');
});

app.get('/history.json', function(req, res) {
    console.log('getting history data');
    res.json(dataHub.getData());
});

console.log('Listening')
app.use(express.static('public'));
app.listen(80);
