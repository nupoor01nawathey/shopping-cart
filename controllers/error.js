
exports.notFound = (req, res, next) => {
    res.render('404', { 
          pageTitle: 'Error',
          path: '/'
    });
  //res.status(404).sendFile(path.join(__dirname, 'views', '404'));
}