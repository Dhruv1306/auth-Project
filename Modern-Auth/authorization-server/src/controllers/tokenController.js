const db = require('../config/database');
const { verifyCodeChallenge } = require('../services/pkceService');
const { generateAccessToken, generateIdToken } = require('../services/tokenService');

// Handle token exchange POST
async function handleToken(req, res) {
    const { code, client_id, redirect_uri, code_verifier } = req.body;

    // Find code in DB
    const [codes] = await db.query('SELECT * FROM authorization_codes WHERE code = ?', [code]);
    if (codes.length === 0) {
        return res.status(400).json({ error: 'Invalid code' });
    }
    const authCode = codes[0];

    // Validate client, redirect_uri, expiry
    if (
        authCode.client_id !== client_id ||
        authCode.redirect_uri !== redirect_uri ||
        new Date(authCode.expires_at) < new Date()
    ) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    // Validate PKCE
    const validPKCE = verifyCodeChallenge(code_verifier, authCode.code_challenge, authCode.code_challenge_method);
    if (!validPKCE) {
        return res.status(400).json({ error: 'PKCE verification failed' });
    }

    // Find user
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [authCode.user_id]);
    if (users.length === 0) {
        return res.status(400).json({ error: 'User not found' });
    }
    const user = users[0];

    // Generate tokens
    const accessToken = generateAccessToken({ user_id: user.id, email: user.email, scope: authCode.scope });
    const idToken = generateIdToken({ user_id: user.id, email: user.email, name: user.name });

    // Delete code (one-time use)
    await db.query('DELETE FROM authorization_codes WHERE code = ?', [code]);

    // Return tokens
    res.json({ access_token: accessToken, id_token: idToken });
}

module.exports = { handleToken };