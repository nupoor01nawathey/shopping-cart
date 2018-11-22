const express   = require('express'),
      { check } = require('express-validator/check'),
      router    = express.Router();

const User      = require('../models/user');

const authController = require('../controllers/auth');

router.get('/signup', authController.getSignup);
router.post('/signup',
      check(
            'password',
            'Please enter a password with at least 4 characters.'
      )
      .isLength({ min: 4 })
      .trim() ,
      check(
            'confirmPassword'
      )
      .trim()
      .custom((value, { req }) => {
      if (value !== req.body.password) {
            throw new Error('Passwords have to match!');
      }
      return true;
      }),
      check('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please enter a valid email.')
      .custom(value => {
            return User
                     .findOne({where: {email: value}})
                     .then(user => {
                     if (user) {
                        return Promise.reject('E-mail already in use');
                     }
            });
      }), 
authController.postSignup);

router.get('/login',authController.getLogin);
router.post('/login', 
   check(
      'password',
      'Please enter a password with at least 4 characters.'
   )
   .isLength({ min: 4 })
   .trim() ,
   check(
         'email',
         'Please enter a valid email.'
      )
      .isEmail()
      .normalizeEmail(),
authController.postLogin);

router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

router.post('/logout', authController.postLogout)

module.exports = router;