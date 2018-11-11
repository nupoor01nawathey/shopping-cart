const Sequelize = require('sequelize');
const sequelize = new Sequelize('ShoppingCart', 'root', 'YOUR_MYSQL_PASSWORD', {
    dialect: 'mysql',
    host: 'localhost',
    operatorsAliases: false
});

module.exports = sequelize;
