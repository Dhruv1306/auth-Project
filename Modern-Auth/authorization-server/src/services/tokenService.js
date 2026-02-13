const jwt = require('jsonwebtoken');
const config = require('../config');

// Generate JWT access token
function generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.accessTokenExpiry });
}

// Generate JWT ID token
function generateIdToken(payload) {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.idTokenExpiry });
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (err) {
        return null;
    }
}

module.exports = {
    generateAccessToken,
    generateIdToken,
    verifyToken
};