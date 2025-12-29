require('dotenv').config();
const mysql = require('mysql2');

// GUNAKAN createPool, bukan createConnection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Pool tidak menggunakan .connect(), dia akan otomatis terhubung saat ada query
console.log('Database Pool Created (Railway)');

module.exports = db;