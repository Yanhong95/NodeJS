const express = require('express');
const { body } = require('express-validator');
const User = require('../models/user');
const Order = require('../models/order');
const orderController = require('../controllers/orderController');
const isAuth = require('../middleware/is-auth');

const router = express.Router()

router.post('/placeOrder', isAuth, orderController.saveOrders);
router.get('/getMyOrder', isAuth, orderController.getOrders);
router.post('/prepareStrip', isAuth, orderController.prepareStrip);

module.exports = router;