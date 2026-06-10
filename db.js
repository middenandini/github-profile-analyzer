const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'mysql-28e92e07-nandini-github-api.e.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_YsaiWc8sQAcZf4cDvTh',
    database: 'defaultdb',
    port: 21601,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false } // Required for cloud database security layers
});

// Auto-create table on startup if it doesn't exist
pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255),
        bio TEXT,
        public_repos INT DEFAULT 0,
        followers INT DEFAULT 0,
        following INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) console.error("Database table creation failed:", err);
    else console.log("MySQL Profiles table verified/created successfully on Aiven Cloud!");
});

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
};

module.exports = { query };