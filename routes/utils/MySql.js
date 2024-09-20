var mysql = require('mysql2');
require("dotenv").config();

const config = {
  connectionLimit: 4,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const pool = mysql.createPool(config);

const connection = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, conn) => {
      if (err) {
        console.error("Error getting MySQL connection:", err);
        return reject(err);
      }
      console.log("MySQL pool connected: threadId " + conn.threadId);

      const query = (sql, binding) => {
        return new Promise((resolve, reject) => {
          conn.query(sql, binding, (err, result) => {
            if (err) {
              console.error("Error executing query:", err);
              return reject(err);
            }
            resolve(result);
          });
        });
      };

      const release = () => {
        return new Promise((resolve) => {
          console.log("MySQL pool released: threadId " + conn.threadId);
          conn.release();
          resolve();
        });
      };

      resolve({ query, release });
    });
  });
};

const query = (sql, binding) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, binding, (err, result, fields) => {
      if (err) {
        console.error("Error executing query:", err);
        return reject(err);
      }
      resolve(result);
    });
  });
};

module.exports = { pool, connection, query };
