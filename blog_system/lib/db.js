const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'w01c5bd6.kasserver.com',
    user: 'd0385d56',
    database: 'd0385d56',
    password: 'Flol5g6h7m',
})

connection.connect();

module.exports = connection;