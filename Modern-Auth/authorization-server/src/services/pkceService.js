const crypto = require('crypto');

// Base64 URL encode (RFC 7636)
function base64UrlEncode(buffer) {
    return buffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// Validate PKCE code challenge  
// purpose : To Checks if the code verifier matches the challenge
function verifyCodeChallenge(codeVerifier, codeChallenge, method = 'S256') {
    if (method === 'plain') {
        return codeVerifier === codeChallenge;
    }
    if (method === 'S256') {
        const hash = crypto.createHash('sha256').update(codeVerifier).digest();
        const challenge = base64UrlEncode(hash);
        return challenge === codeChallenge;
    }
    return false;
}

module.exports = { verifyCodeChallenge };