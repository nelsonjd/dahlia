const mysql = require('mysql');

const pool = mysql.createPool({
    connectionLimit: 5,
    host: 'localhost',
    user: 'dahlia_user',
    password: 'dahliarocks',
    database: 'dahlia'
});

module.exports = {
    pool
};