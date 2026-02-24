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

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3010/auth/google/callback",
  },

  server: {
    port: process.env.PORT || 3001,
  },
};

// This file is for JWT & Server's settings