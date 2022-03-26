const mysql = require('mysql');

const connection = mysql.createConnection({
    host: '...',
    user: '...',
    database: '...',
    password: '...',
})

connection.connect();

module.exports = connection;
