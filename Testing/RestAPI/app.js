const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const feedRoute = require('./routes/feed');
const authRoute = require('./routes/auth');
const app = express();

// 文件上传
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

// 这样制定某个路径为静态路径, 其他地放碰到.js的路径或者.css的路径或者.jpg路径 就回去静态路径"绝对路径"去找.
app.use('/images', express.static(path.join(__dirname, 'images')));

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

app.use('/feed', feedRoute);
app.use('/auth', authRoute);

// 创建 errorHandler 中间件
app.use((error, req, res ,next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({
        message: message,
        data: data
    })
});

mongoose.connect(
        'mongodb+srv://yanhonchen:Cyh19950129@cluster0-fzwor.mongodb.net/Advance_RestAPI_Project?retryWrites=true&w=majority',
        { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        const server = app.listen(8080);
        const io = require('./socket').init(server);
        io.on('connection', socket => {
            console.log('Client connected');
        })
    }).catch(err => console.log(err));

// const MongoClient = require('mongodb').MongoClient;
// const uri = "mongodb+srv://yanhonchen:<password>@cluster0-fzwor.mongodb.net/test?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });