const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const graphqlHttp = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
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

app.use( multer({ storage: fileStorage, fileFilter: fileFilter }).single('image') );

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
    // 针对graphql
    if(req.method === 'OPTIONS'){
        return res.sendStatus(200);
    }
    next();
});

app.use(auth);

app.put('/post-image', (req, res, next) => {
    if (!req.isAuth) {
      throw new Error('Not authenticated!');
    }
    if (!req.file) {
      return res.status(200).json({ message: 'No file provided!' });
    }
    if (req.body.oldPath) {
      filePath = path.join(__dirname, '..', req.body.oldPath);
      fs.unlink(filePath, err => console.log(err));
    }
    return res
      .status(201)
      .json({ message: 'File stored.', filePath: req.file.path });
  });

app.use(
    '/graphql',
    graphqlHttp({
      schema: graphqlSchema,
      rootValue: graphqlResolver,
      graphiql: true,
      customFormatErrorFn(err) {
        if (!err.originalError) {
          return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return { message: message, status: code, data: data };
      }
    })
  );

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
        app.listen(8080);
    }).catch(err => console.log(err));