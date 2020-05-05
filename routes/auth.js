const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user')

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', [
        body('email')
        .isEmail()
        .withMessage('Please enter a valid email address.')
        .normalizeEmail(),
        body('password', 'Password has to be valid.')
        .isLength({ min: 6 })
        .trim()
    ],
    authController.postLogin
);

router.post(
    '/signup', [
        check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then(userDoc => {
                if (userDoc) {
                    return Promise.reject(
                        'E-mail exists already, please choose a different one.'
                    );
                }
            });
        })
        .normalizeEmail(),
        body(
            'password',
            'Min 6 character password is requied.'
        )
        .isLength({ min: 6 })
        .trim(),
        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password have to match!');
            }
            return true;
        }).trim()
    ],
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;