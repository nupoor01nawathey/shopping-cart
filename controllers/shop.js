const fs      = require('fs'),
      path    = require('path'),
      pdfkit  = require('pdfkit');

const Product = require('../models/product'),
       Cart   = require('../models/cart'),
       Order  = require('../models/order');

// extract product list, render add to cart button in the view
exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findByPk(prodId)
  .then((product) => {
    //.log('prinitng products array',[product]);
    res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
  })
  .catch(err => { 
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
   });
};

// render cart view
exports.getCart = (req, res, next) => {
  req.user
    .getCart()
    .then(cart => {
      return cart
        .getProducts()
        .then(products => {
          res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products
          });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};

// check if products exists in cart for given productId, increment if already exists else add new product with qty in the cart
exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let fetchedCart;
  let newQuantity = 1;
  req.user.getCart()
  .then(cart => {
    fetchedCart = cart;
    return cart.getProducts({ where: { id: prodId } });
  })
  .then(products => {
    let product;
    if(products.length > 0) {
      product = products[0];
    }
    if(product) {
      const oldQuantity = product.cartItem.quantity;
      newQuantity = oldQuantity + 1;
      return product;
    }
    return Product.findByPk(prodId);      
  })
  .then(product => {
    return fetchedCart.addProduct(product, { 
      through: { quantity: newQuantity }
    });
  })
  .then(() => {
    res.redirect('/cart');
  })
  .catch(err => { 
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
   });
};

// delete cart in case user changes his mind to not make any purchase
exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .getCart()
    .then( cart => {
      console.log(cart);
      return cart.getProducts({where: {id: prodId}})
    })
    .then(products => {
      if(products.length > 0) {
        const product = products[0];
        console.log(product);
        return product.cartItem.destroy(); // FIX remove image from disk also
      }
    })
    .then(() => {
      console.log('product deleted successfully');
      res.redirect('/cart');
    })
    .catch(err => { 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
     });
}

// get previous orders made by user
exports.getOrders = (req, res, next) => {
  req.user
    .getOrders({ include: ['products'] })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        isAuthenticated: req.session.isLoggedIn
      });    
    })
    .catch(err => console.log(err));

};

exports.postOrder = (req, res, next) => {
  // Set your secret key: remember to change this to your live secret key in production
  // See your keys here: https://dashboard.stripe.com/account/apikeys
  var stripe = require("stripe")(process.env.STRIPE_KEY);
      
  // Token is created using Checkout or Elements!
  // Get the payment token ID submitted by the form:
  const token = req.body.stripeToken; // Using Express
      
  let total = 0;
  let fetchedCart;
  req.user
    .getCart()
    .then(cart => {
      fetchedCart = cart;
      return cart.getProducts();
    })
    .then(products => {
      products.forEach(p => {
        total += p.cartItem.quantity * p.price; // calculate total price
      });
      return req.user
        .createOrder()
        .then(order => {
          return order.addProducts(products.map(product => {
            product.orderItem = { quantity: product.cartItem.quantity }
            //product.userId = req.user.userId;
            return product;
          }));
        })
        .then((result) => {
          const charge = stripe.charges.create({ // make charges using stripe
            amount: total * 100,
            currency: 'usd',
            description: 'Charge for ordered products',
            source: token,
            metadata: {
              order_id: result.id // store order_id in stripe acc
            }
          });
          return fetchedCart.setProducts(null);
        })
        .then(() => {
          res.redirect('/orders');
        })
        .catch(err => console.log(err));
    })
    .catch(err => { 
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
     });
}

// render checkout view with order details
exports.getCheckout = (req, res, next) => {
  req.user
    .getCart()
    .then(cart => {
      return cart
        .getProducts()
        .then(products => {
          let total = 0;
          products.forEach(p => {
            total += p.cartItem.quantity * p.price;
          });
          res.render('shop/checkout', {
            path: '/checkout',
            pageTitle: 'Checkout',
            products: products,
            total: total
          });
        })
        .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
};


// download order invoice in pdf format, TODO send a copy of invoice to the registered email id
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  const invoiceName = 'invoice-' + orderId + '.pdf' ,
        invoicePath = path.join('data', 'invoices', invoiceName);

  Order.findByPk(orderId)
  .then(order => {
    if(!order) {
      console.log('No order found with the given orderId');
      return next(new Error('No order found with the given orderId'));
    }
    if(order.userId !== req.user.id) {
      console.log('Unauthorized');
      return next(new Error('Unauthorized!'));
    }
    const pdfDoc = new pdfkit();
    res.setHeader('Content-type', 'application/pdf');
    res.setHeader('Content-disposition', 'inline;filename="' + invoiceName + '"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    pdfDoc.fontSize(26).text('Invoice', {underline: true});
    pdfDoc.text('-------------------------------------');

    let totalPrice = 0;
    return order.getProducts()
    .then(prods => {
      prods.forEach(p => {
        totalPrice += p.quantity * p.price;
        pdfDoc
        .fontSize(16)
        .text(p.title + ' - ' +
        p.quantity + // TODO Quantity not getting populated
        ' x ' +
        '$' +
        p.price
        );
        pdfDoc.text('-------------------------------------');
      });
    })
    .then(() => {
      pdfDoc.end();
    })
    .catch(err => console.log(err));
  })
  .catch(err => next(err));
}
