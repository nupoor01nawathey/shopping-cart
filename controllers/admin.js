const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/add-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true
  });
};

exports.postAddProduct = (req, res, next) => {
  const title       = req.body.title,
        imageUrl    = req.body.imageUrl,
        price       = req.body.price,
        description = req.body.description;
        
  const product     = new Product(title, imageUrl, description, price);
  product.save()
  .then((product) => {
    console.log(product);
    res.redirect('/')
  })
  .catch(err => {
    console.log(err);
  });
};

exports.getProducts = (req, res, next) => {
  Product.fetchAll(products => {
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products'
    });
  });
};
