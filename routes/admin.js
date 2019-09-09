const express = require('express');

const productsControllers = require('../controllers/products');

const router = express.Router();

router.get('/add-product', productsControllers.getAddProduct);

router.post('/add-product', productsControllers.postAddProduct);

module.exports = router;