exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        // isAuthenticated: req.isloggedIn
    });
}

exports.postLogin = (req, res, next) => {
    req.session.isLoggedIn = true;
    res.redirect('/');
}
  
exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
}