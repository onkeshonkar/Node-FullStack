const path = require('path');

const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product', [
    body('title', 'Valid product title is required.')
    .isString()
    .isLength({ min: 3 })
    .trim(),
    body('price').isFloat(),
    body('description', 'Enter a valid descpription.')
    .isLength({ min: 5, max: 300 })
    .trim()
], isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
        body('title', 'Valid product title is required.')
        .isString()
        .isLength({ min: 3 })
        .trim(),
        body('price').isFloat(),
        body('description', 'Enter a valid descpription.')
        .isLength({ min: 5, max: 300 })
        .trim()
    ],
    isAuth, adminController.postEditProduct);

router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;