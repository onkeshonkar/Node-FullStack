const Sequelize = require('sequelize');

const sequalize = require('../util/database');

const OrderItem = sequalize.define('orderItem', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNUll: false,
        primaryKey: true
    },
    quantity: Sequelize.INTEGER
});

module.exports = OrderItem;