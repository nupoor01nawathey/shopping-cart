const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/add-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true,
    //isAuthenticated: req.session.isLoggedIn
  });
};

exports.postAddProduct = (req, res, next) => {
  const title       = req.body.title,
        imageUrl    = req.body.imageUrl,
        price       = req.body.price,
        description = req.body.description;
  
  req.user.createProduct({
    title: title, 
    imageUrl: imageUrl, 
    description: description, 
    price: price,
    userId: req.user
  })
  .then(result => {
    console.log(result);
    res.redirect('/admin/products');
  })
  .catch(err => {
    console.log(err);
  });
};

exports.getProducts = (req, res, next) => {
  Product.findAll({where: {userId: req.user.id}})  
  .then(products => {
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products'
    })
  })
  .catch(err => { console.log(err)});
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if(!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  //Product.findById(prodId)
  req.user.getProducts({ where: {id: prodId} })
  .then(products => {
    const product = products[0];
    if(!product) {
      return res.redirect('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product: product
    })
  })
  .catch(err => {
    console.log(err);
  })
}

exports.postEditProduct = (req, res, next) => {
  const prodId       = req.body.productId,
  updatedTitle       = req.body.title,
  updatedimageUrl    = req.body.imageUrl,
  updatedprice       = req.body.price,
  updateddescription = req.body.description;

  Product.findByPk(prodId)
  .then(product => {
    product.title = updatedTitle;
    product.imageUrl = updatedimageUrl;
    product.price = updatedprice;
    product.description = updateddescription;
    return product.save();
  })
  .then(result => {
    res.redirect('/admin/products');
  })
  .catch(err => {
    console.log(err);
  })
}

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findByPk(prodId)
  .then(product => {
      return product.destroy();
  })
  .then((result) => {
    console.log('Product destroyed')
    res.redirect('/admin/products');
  })
  .catch(err => {
    console.log(err);
  })
}
