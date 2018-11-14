const User = require('../models/user');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        isAuthenticated: req.session.isLoggedIn
    });
}

exports.postLogin = (req, res, next) => {
    const email    = req.body.email,
          password = req.body.password;
    User.findOne({ where: {email: email} })
    .then(user => { 
        if(!user) {
            return res.redirect('/login');
        }
        bcrypt
            .compare(password, user.password)
            .then(doMatch => {
                if(doMatch) {
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    user.createCart();
                    return req.session.save((err) => { // async alert: save session first and then redirect
                        console.log(err);
                        res.redirect('/');
                    });
                }
                res.redirect('/login');
            })     
            .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
}
  
exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        isAuthenticated: req.session.isLoggedIn
    });
}

exports.postSignup = (req, res, next) => {
    const email    = req.body.email,
          password = req.body.password;

    User.findOne({ where: {email: email} })
    .then(foundEmail => {
        if(foundEmail) {
            console.log('user already exists, please try with new email id');
            return res.redirect('/signup');
        } 
        return bcrypt.hash(password, 12)
        .then(hashedPassword => {
            User.build({
                email: email,
                password: hashedPassword
            })
            .save()
            .then(result => {
                console.log('user created successfully');
                result.createCart();
                res.redirect('/login');    
            })
            .catch(err => console.log(err));    
        })
    })
    .catch(err => console.log(err));
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
}