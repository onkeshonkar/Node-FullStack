const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-app', 'root', 'giridih2019', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize; 