require('dotenv').config();

module.exports = {
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production'
    },
    server: {
        port: process.env.PORT || 3002
    }
};