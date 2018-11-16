const bcrypt            = require('bcryptjs'),
      nodemailer        = require('nodemailer'),
      sendgridTransport = require('nodemailer-sendgrid-transport');

const User              = require('../models/user');

const transporter       = nodemailer.createTransport(sendgridTransport({
    auth : {
        api_key : 'YOUR_AUTH_KEY'
    }
}));

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: req.flash('error')
        //isAuthenticated: req.session.isLoggedIn
    });
}

exports.postLogin  = (req, res, next) => {
    const email    = req.body.email,
          password = req.body.password;
    User.findOne({ where: {email: email} })
    .then(user => { 
        if(!user) {
            req.flash('error', 'Incorrect email id');
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
                        // console.log(err);   
                        res.redirect('/');
                    });
                } else {
                    req.flash('error', 'Incorrect password');
                    res.redirect('/login');
                }
            })     
            .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
}
  
exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        errorMessage: req.flash('error')
    });
}

exports.postSignup = (req, res, next) => {
    const email    = req.body.email,
          password = req.body.password;

    User.findOne({ where: {email: email} })
    .then(foundEmail => {
        if(foundEmail) {
            req.flash('error','user already exists, please try with new email id');
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
                res.redirect('/login');   
                result.createCart();
                return transporter.sendMail({
                        to: email,
                        from: 'node-shop@donotreply.com',
                        subject: 'Signup successful!',
                        html: '<h3>Welcome to the node-shop account. You have successfully signed up!</h3>'
                    })
                })
                .catch(err => console.log(err)); 
            })
            .catch(err => console.log(err));
        })
    .catch(err => console.log(err));
}

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
}
