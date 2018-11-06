const express = require('express'),
      router  = express.Router();

const adminController = require('../controllers/admin');

router.get('/add-product', adminController.getAddProduct);
router.post('/add-product', adminController.postAddProduct);
router.get('/products', adminController.getProducts); // /admin/products

module.exports = router;