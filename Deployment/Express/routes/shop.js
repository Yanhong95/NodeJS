const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart);

router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

//get stripe session_id then redirect to checkout.ejs
router.get('/checkout', isAuth, shopController.getCheckout);

// send products informations and payment methords to Stripe, 
// when finished the payment, Stripe will return the status of payment

// when payment successd, go to Orders page
router.get('/checkout/success', shopController.getCheckoutSuccess);

// when payment failed, go to checkout page again.
router.get('/checkout/cancel', shopController.getCheckout);

router.get('/orders', isAuth, shopController.getOrders);

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

module.exports = router;
