const express = require('express');
const bodyParser = require('body-parser');
const feedRoute = require('./routes/feed');

const app = express();

// parse application/x-www-form-urlencoded <from></from> 针对form传输
app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json 针对json传输
app.use(bodyParser.json())

app.use((req, res, next) => {
    // 所有的domain都可以access这个server
    res.setHeader('Access-Control-Allow-Origin', '*');
    // 哪些method可以被接受
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    // client可以设置哪些header
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed',feedRoute);

app.listen(8080);
