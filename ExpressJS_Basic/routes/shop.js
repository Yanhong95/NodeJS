const express = require('express');
const path = require('path');
const rootDir = require('../util/path');
const router = express.Router();

// var favicon = require('serve-favicon');
// app.use(favicon(__dirname + '/public/images/favicon.ico'));
// app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));
router.get('/favicon.ico', (req, res) => res.status(204));
router.get('/', (req, res, next) => {
  // res.send('<h1>Hello from Express!</h1>');
  // _dirname指向的是这个文件所在的文件夹.
  res.sendFile(path.join(rootDir, 'views', 'shop.html'));
});

module.exports = router
