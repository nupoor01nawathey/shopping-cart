const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'ShoppingCart',
    password: 'YOUR_MYSQL_PASSWORD'
});

module.exports = pool.promise();
