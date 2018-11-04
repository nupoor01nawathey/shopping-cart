const express = require('express'),
      path    = require('path'),
      router  = express.Router();

const rootDir = require('../util/path');

router.get('/get-product', (req, res, next) => {
    res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
});

router.post('/product', (req, res, next) => {
    res.redirect('/');
});


module.exports = router;