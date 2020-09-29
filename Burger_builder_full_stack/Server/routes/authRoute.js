const express = require('express');
const { body } = require('express-validator');

const User = require('../models/user');
const authController = require('../controllers/authController');
// const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.post(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        console.log(value);
        return User.findOne({ email: value }).then(userDoc => {
          if (userDoc) {
            return Promise.reject('E-Mail address already exists!');
          }
        });
      })
      .normalizeEmail(),
    body('password').trim().isLength({ min: 3 }),
    body('name').trim().isLength({ min: 2 })
  ],
  authController.signUp
);

router.post('/login', authController.login);

module.exports = router;