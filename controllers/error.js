
exports.notFound = (req, res, next) => {
    res.render('404', { 
          pageTitle: 'Error',
          path: '/404'
    });
  //res.status(404).sendFile(path.join(__dirname, 'views', '404'));
}