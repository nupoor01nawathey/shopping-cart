const { validationResult } = require('express-validator/check');
const Product = require('../models/product');

const ITEMS_PER_PAGE = 1;
let   OFFSET = 0;

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/edit-product',
    formsCSS: true,
    productCSS: true,
    activeAddProduct: true,
    editing: false,
    hasErrors: false,
    errorMessage: null
  });
};

exports.postAddProduct = (req, res, next) => {
  const title       = req.body.title,
        image       = req.file,
        price       = req.body.price,
        description = req.body.description;

  const imageUrl    = image.path;

  if(!image) {
    return res.status(422).render('admin/products', {
      pageTitle: 'Add Products',
      path: '/admin/products',
      prods: {
        title: title,
        price: price,
        description: description
      },
      editing: false,
      hasErrors: true,
      errorMessage: 'Please upload images with format png/jpg/jpeg!'
    })
  }

  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).render('admin/products', {
      //prods: products,
      pageTitle: 'Add Products',
      path: '/admin/products',
      prods: {
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl
      },
      editing: false,
      hasErrors: true,
      errorMessage: errors.array()[0].msg
    })
  }

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
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getProducts = (req, res, next) => {
  let path;
  if(req.route.path === '/') {
    path = '/shop';
  } else if(req.route.path === '/products') {
    path = '/products';
  }
  const page = +req.query.page || 1;
  Product.count()
  .then(numProducts => {
    totalItems = numProducts;
    return Product.findAll({ 
      offset: (page-1) * ITEMS_PER_PAGE, 
      limit: ITEMS_PER_PAGE
    }) 
    .then(products => {
      res.render('admin/products', {
          prods: products,
          pageTitle: 'Admin Products',
          path: path,
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalItems/ITEMS_PER_PAGE)
        });
      })
      .catch(err => {
        console.log(err);
      });
  })
  .catch(err => { 
    console.log(err);
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};


exports.getEditProduct = (req, res, next) => { // TODO FIX EDIT-PRODUCT ROUTE
  const editMode = req.query.edit;
  if(!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;

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
      product: product,
      editing: true,
      hasErrors: false,
      errorMessage: null
    })
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  })
}

exports.postEditProduct = (req, res, next) => {
  const prodId       = req.body.productId,
  updatedTitle       = req.body.title,
  image              = req.file,
  updatedprice       = req.body.price,
  updateddescription = req.body.description;
  
  const updatedimageUrl = image.path;

  if(!image) {
    return res.status(422).render('admin/edit-products', {
      pageTitle: 'Edit Products',
      path: '/admin/products',
      prods: {
        title: title,
        price: price,
        description: description
      },
      editing: false,
      hasErrors: true,
      errorMessage: 'Please upload images with format png/jpg/jpeg!'
    })
  }

  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      product: {
        title: updatedTitle,
        price: updatedprice,
        description: updateddescription,
        imageUrl: updatedimageUrl
      },
      editing: true,
      hasErrors: true,
      errorMessage: errors.array()[0].msg
    })
  }

  Product.findByPk(prodId)
  .then(product => {
    if(product.userId !== req.user.id) { //check if product created by user stored in db
      return res.redirect('/');
    }
    Product.update({
      title: updatedTitle, 
      imageUrl: updatedimageUrl, 
      description: updateddescription, 
      price: updatedprice
  }, { where: {id: prodId} })
  })
  .then(() => {
    console.log('successfully updated product');
    return res.redirect('/admin/products');
  })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  })
}


exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findOne({ where: {id: prodId, userId: req.user.id}})
  .then(product => {
    if(!product) {
      return res.redirect('/');
    }
    return product.destroy(); // TODO DELETE IMAGE FILES FROM DISK
  })
  .then((result) => {
    console.log('Product destroyed')
    //res.redirect('/admin/products');
    res.status(200).json({
      message: 'Success'
    });
  })
  .catch(err => { 
    // const error = new Error(err);
    // error.httpStatusCode = 500;
    // return next(error);
    res.status(500).json({
      message: 'deleting product failed!'
    });
   });
}
