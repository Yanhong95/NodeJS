const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoute = require('./routes/authRoute');
const Ingredient = require('./models/ingredient');
const ingredientRoute = require('./routes/ingredientRoute');
const orderRoute = require('./routes/orderRoute');
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

// app.use('/order', orderRoute);
app.use('/auth', authRoute);
app.use('/ingredients' , ingredientRoute)
app.use('/orders', orderRoute);

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
  'mongodb+srv://YanhongChen:Cyh19950129@nodejsplayground-kxxqg.mongodb.net/BurgerBuilderProject?retryWrites=true&w=majority',
  { useNewUrlParser: true, useUnifiedTopology: true })
.then(result => {
  Ingredient.findOne()
    .then(result => {
      if(!result){
        const ingredient = new Ingredient({ bacon: 0, cheese: 0, meat: 0, salad: 0 });
        ingredient.save();
      }
    })
  app.listen(8080);
}).catch(err => console.log(err));