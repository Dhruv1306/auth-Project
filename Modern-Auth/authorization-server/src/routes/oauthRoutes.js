const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const tokenController = require('../controllers/tokenController');

// Login page
router.get('/authorize', authController.showLogin);
router.post('/login', authController.handleLogin);

// Registration page
router.get('/register', authController.showRegister);
router.post('/register', authController.handleRegister);

// Handling consent form POST
router.post('/consent', authController.handleConsent);

// Handling the token exchange POST
router.post('/token', tokenController.handleToken);

// ============================================
// GOOGLE OAUTH ROUTES
// ============================================

/*
 * Step 1: Start Google OAuth
 * - Encode OAuth params (client_id, code_challenge, etc.) as Base64 in the `state` parameter
 * - Google will return this `state` unchanged in the callback
 * - This avoids session loss issues (Passport regenerates the session on callback)
 */
router.get('/auth/google', (req, res, next) => {
    // Encode OAuth params as Base64 JSON in the "state" parameter
    const oauthParams = {
        client_id: req.query.client_id,
        redirect_uri: req.query.redirect_uri,
        scope: req.query.scope,
        code_challenge: req.query.code_challenge,
        code_challenge_method: req.query.code_challenge_method,
    };
    const state = Buffer.from(JSON.stringify(oauthParams)).toString('base64');

    // Redirect to Google with state
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state,
    })(req, res, next);
});

/*
 * Step 2: Google redirects back here after user authenticates
 * - Passport extracts user profile (email, name)
 * - User is created/found in MySQL (handled by passport.js strategy)
 * - The `state` parameter carries our OAuth params back from Google
 * - We then continue the normal OAuth flow: generate auth code → redirect to client
 */
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/authorize?error=google_auth_failed' }),
    authController.handleGoogleCallback
);

// ============================================
// DELETE ACCOUNT API
// ============================================
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/database');

router.delete('/api/delete-account', async (req, res) => {
    try {
        // Verify the JWT token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret);
        const userId = decoded.user_id;

        if (!userId) {
            return res.status(400).json({ error: 'Invalid token — no user ID found' });
        }

        // Step 1: Fetch user data before deleting
        const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = users[0];

        // Step 2: Archive user into deleted_users table (kept for 14 days)
        await db.query(
            "INSERT INTO deleted_users (id, email, password, name, original_created_at) VALUES (?, ?, ?, ?, ?)",
            [user.id, user.email, user.password, user.name, user.created_at]
        );

        // Step 3: Delete user's authorization codes (foreign key constraint)
        await db.query("DELETE FROM authorization_codes WHERE user_id = ?", [userId]);

        // Step 4: Delete user from main users table
        await db.query("DELETE FROM users WHERE id = ?", [userId]);

        // Step 5: Auto-purge deleted_users older than 14 days
        await db.query("DELETE FROM deleted_users WHERE deleted_at < NOW() - INTERVAL 14 DAY");

        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.error('Delete account error:', err);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;