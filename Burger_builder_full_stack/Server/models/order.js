const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  ingredients: {
    bacon: {
      type: Number
    },
    cheese: {
      type: Number
    },
    meat: {
      type: Number
    },
    salag: {
      type: Number
    }
  },
  orderData: {
    name: {
      type: String,
      required: true
    },
    street:{
      type: String,
      required: true
    },
    zipCode:{
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    email:{
      type: String,
      required: true
    },
    deliveryMethod: {
      type: String,
      required: true
    }
  },
  price: {
    type: Number,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  }
});

module.exports = mongoose.model('order', orderSchema);