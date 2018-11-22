const express   = require('express'),
      { check } = require('express-validator/check');


const adminController = require('../controllers/admin');

const isAuth = require('../middleware/isAuth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', isAuth, 
    check('title')
        .isString()
        .isLength({min: 3})
        .trim(),
    check('price').isFloat(),
    check('description')
        .isString()
        .isLength(8)
        .trim()
    , adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', isAuth,
    check('title')
    .isString()
    .isLength({min: 3})
    .trim(),
    check('price').isFloat(),
    check('description')
    .isString()
    .isLength(8)
    .trim()
, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
