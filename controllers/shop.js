const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    //console.log(products)
    Product.fetchAll( products => {
        res.render('shop/shop', { 
            prods: products, 
            pageTitle: 'All Products', 
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