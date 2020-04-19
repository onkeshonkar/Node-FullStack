const Sequelize = require('sequelize');

const sequalize = require('../util/database');

const Cart = sequalize.define('cart', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNUll: false,
        primaryKey: true
    }
});

module.exports = Cart;