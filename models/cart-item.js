const Sequelize = require('sequelize');

const sequalize = require('../util/database');

const CartItem = sequalize.define('cartItem', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNUll: false,
        primaryKey: true
    },
    quantity: Sequelize.INTEGER
});

module.exports = CartItem;