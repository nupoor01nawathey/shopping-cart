const isAuth = require('../middleware/isAuth');

const express = require('express');

const adminController = require('../controllers/admin'),
      shopController  = require('../controllers/shop');

const router = express.Router();

router.get('/', adminController.getProducts);

router.get('/products', adminController.getProducts);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', shopController.getCart);

router.post('/cart', shopController.postCart);

router.post('/cart-delete-item', shopController.postCartDeleteProduct);

router.get('/orders', shopController.getOrders);

router.get('/checkout', shopController.getCheckout);

router.get('/orders/:orderId', shopController.getInvoice);

router.get('/checkout', isAuth, shopController.getCheckout);

module.exports = router;
