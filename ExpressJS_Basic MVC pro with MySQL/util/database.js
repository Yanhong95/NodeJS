// const mysql = require('mysql2');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'NodeJS_shop',
//     password: 'Cyh19950129'
// });

// module.exports = pool.promise();

const Sequelize = require('sequelize');

const sequelize = new Sequelize('NodeJS_shop', 'root', 'Cyh19950129', {
  dialect: 'mysql',
  host: 'localhost',
  // define: {
  //   timestamps: false
  // }
});

module.exports = sequelize;
