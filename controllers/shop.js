const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    //console.log(products)
    Product.fetchAll( products => {
        res.render('shop/product-list', { 
            prods: products, 
            pageTitle: 'All Products', 
            path: '/products' 
        });
    });
}

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId, product => {
        console.log(product);
        res.render('shop/product-detail', { 
            prods: product, 
            pageTitle: 'Product', 
            path: '/products'
        });
    });
}

exports.getIndex = (req, res, next) => {
    Product.fetchAll( products => {
        res.render('shop/index', { 
            prods: products, 
            pageTitle: 'Index', 
            path: '/' 
        });
    }); 
}

exports.getCart = (req, res, next) => { 
    res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart'
    });
}

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    
}

exports.getOrders = (req, res, next) => { 
    res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Order'
    });
}

exports.getCheckout = (req, res, next) => { 
    res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout'
    });
}