const crypto                = require('crypto'),
      bcrypt                = require('bcryptjs'),
      { check }             = require('express-validator/check'),
      { validationResult }  = require('express-validator/check'),
      nodemailer            = require('nodemailer'),
      sendgridTransport     = require('nodemailer-sendgrid-transport');

const User         = require('../models/user');

const transporter  = nodemailer.createTransport(sendgridTransport({
    auth : {
        api_key : 'YOUR_SENDGRID_API_KEY'
    }
}));

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: req.flash('error'),
        oldCredentials: {
            email: '',
            password: ''
        }
    });
}

exports.postLogin  = (req, res, next) => {
    const email    = req.body.email,
          password = req.body.password;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldCredentials: {
                email: email,
                password: password
            }
        });
    }

    User.findOne({ where: {email: email} })
    .then(user => { 
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
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: errors.array()[0].msg,
                        oldCredentials: {
                            email: email,
                            password: password
                        }
                    });
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
        errorMessage: req.flash('error'),
        oldCredentials: {
            email: '',
            password: '',
            confirmPassword: ''
        }
    });
}

exports.postSignup = (req, res, next) => {
    const email    = req.body.email,
          password = req.body.password;
          confirmPassword = req.body.confirmPassword;
          
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldCredentials: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            }
        });
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
                    from:    'node-shop@donotreply.com',
                    subject: 'Signup successful!',
                    html:    '<h3>Welcome to the node-shop account. You have successfully signed up!</h3>'
                })
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

exports.getReset = (req, res, next) => {
    res.render('auth/reset', {
        pageTitle: 'Reset',
        path: '/reset',
        errorMessage: req.flash('error')
    });
}

exports.postReset = (req, res, next) => {
    const email = req.body.email
    crypto.randomBytes(32, (err, buffer) => {
        if(err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ where: {email: email} })
        .then(user => {
            if(!user) {
                req.flash('error', 'No email id exists with entered email id')
                return res.redirect('/reset');
            }
            resetToken = token;
            resetTokenExpiration = Date.now() + 3600000; // valid for curr_time + 1hr
            User.update({
                resetToken: resetToken,
                resetTokenExpiration: resetTokenExpiration
            }, { where: {email: email} })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    to: email,
                    from:    'node-shop@donotreply.com',
                    subject: 'Password Reset!',
                    html:  `<p>You request password reset.</p>
                    <p>Password reset link is valid for 1hr</p>
                    <p>Click this <a href="http://localhost:3000/reset/${token}"> link</a> to reset Password</p>
                    `
                });
            })
            .catch(err => console.log(err))
        }).catch(err => console.log(err))
    })
}


exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({ where: {resetToken: token}})
    .then(user => {
        res.render('auth/new-password', {
            pageTitle: 'New Password',
            path: '/new-password',
            errorMessage: req.flash('error'),
            userId: user.id,
            passwordToken: token
        });
    })
    .catch(err => console.log(err));
}

exports.postNewPassword = (req, res, next) => {
    const newPassword   = req.body.password,
          userId        = req.body.userId,
          passwordToken = req.body.passwordToken;

    User.findOne({where: {resetToken: passwordToken, id: userId}})
    .then(user => {
        if(!user) {
            console.log(err);
            return res.redirect('/');
        }
        return bcrypt.hash(newPassword, 12)
        .then(hashedPassword => {
            User.update({
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiration: null
            }, {where: {resetToken: passwordToken, id: userId}});
            return res.redirect('/');
        })
        .catch(err => console.log(err));   
    })
    .catch(err => console.log(err));
}   
