require('dotenv').config();
const mysql = require('mysql');

const db = mysql.createConnection({
    host: process.env.DB_HOST,      // interchange.proxy.rlwy.net
    port: process.env.DB_PORT,      // 16541
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,  // 'railway'
});

db.connect((err) => {
    if (err) {
        console.error('Gagal terhubung ke database Railway:', err.message);
        return;
    }
    console.log('Berhasil terhubung ke MySQL Railway!');
});

module.exports = db;