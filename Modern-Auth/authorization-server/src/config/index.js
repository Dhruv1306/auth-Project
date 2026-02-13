require('dotenv').config();    // Load environment variables from .env file

// console.log('DB_PASSWORD:', process.env.DB_PASSWORD);  just for debugging


module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiry: "1h",
    idTokenExpiry: "1h",
  },

  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,    // MySQL username
    password: process.env.DB_PASSWORD, // MySQL password
    database: process.env.DB_NAME,
  },

  server: {
    port: process.env.PORT || 3001,
  },
};

// This file is for JWT & Server's settings