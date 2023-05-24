/*
{
  "development": {
    "username": "root",
    "password": null,
    "database": "database_development",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "mysql"

  }
}
*/
require('dotenv').config();
module.exports = {
  development: {
    username: process.env.DB_USER,
    password: "password",
    database: process.env.DB_NAME,
    host:  process.env.DB_HOST,
    dialect: "mysql"
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PW,
    database: process.env.DB_NAME,
    host:  process.env.DB_HOST,
    dialect: "mysql",
    logging: false
  }
}
