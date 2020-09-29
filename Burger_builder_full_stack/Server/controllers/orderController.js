
const { validationResult } = require('express-validator');
const User = require('../models/user');
const Order = require('../models/order');

exports.prepareStrip = async(req, res, next) => {
  try {
    userId = req.userId
    const user = await User.findById(userId);
    if(!user){
      const Error = new Error('Unable to find the user.');
      error.statusCode = 401;
      throw error;
    }
    const orderData = req.body.orderData;
    const stripe = require('stripe')('sk_test_51Gu1oaEj9kkxfAq5PtIQZUvlEE6IlJpQN8hwfKP7nIXikIZpsysR0aYJshocriWswRKt4bv8n2NPAdPcdpFqk0Tv00y89NMEK3');
    const paymentIntent = await stripe.paymentIntents.create({
      amount: +orderData.price * 100,
      currency: 'usd',
      description: 'BurgerProject',
      // Verify your integration in this guide by including this parameter
      metadata: {integration_check: 'accept_a_payment'},
    });
    res.status(201).json({client_secret: paymentIntent.client_secret});
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.saveOrders = async (req, res, next) => {
  try {
    userId = req.userId
    const user = await User.findById(userId);
    if(!user){
      const Error = new Error('Unable to find the user.');
      error.statusCode = 401;
      throw error;
    }
    const orderdata = {...req.body.orderData, user}
    const order = new Order(orderdata);
    const result = await order.save();
    user.orders.push(result);
    await user.save();
    res.status(201).json({_id: result._id});
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getOrders = async(req, res, next) => {
  try {
    userId = req.userId
    const user = await User.findById(userId).populate({path: 'orders', model: 'order'});
    if(!user){
      const Error = new Error('Unable to find the user.');
      error.statusCode = 401;
      throw error;
    }
    const orders = {}
    user.orders.forEach(order => {
      orders[order._id] = {...order._doc}
    });
    res.status(201).json(orders);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};