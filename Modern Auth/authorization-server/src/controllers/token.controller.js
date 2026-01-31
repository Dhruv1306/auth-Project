// Token Controller - Issues access_token, id_token, refresh_token
// This is the heart of OAuth2.0 - exchanging codes for tokens

const fs = require("fs");
const path = require("path");
const tokenService = require("../services/token.service");
const pkceService = require("../services/pkce.service");
const config = require("../config");

const codesPath = path.join(__dirname, "../../data/codes.json");

// In-memory storage for refresh tokens (in production, use database)
const refreshTokens = new Map();

// ============================================
// POST /token
// ============================================
// Exchange authorization_code for tokens
// Or exchange refresh_token for new access_token

exports.exchangeToken = (req, res) => {
  const { grant_type } = req.body;

  if (grant_type === "authorization_code") {
    return handleAuthorizationCodeGrant(req, res);
  } else if (grant_type === "refresh_token") {
    return handleRefreshTokenGrant(req, res);
  } else {
    return res.status(400).json({
      error: "unsupported_grant_type",
      error_description:
        "Supported grant types: authorization_code, refresh_token",
    });
  }
};

// ============================================
// Handle Authorization Code Grant
// ============================================
function handleAuthorizationCodeGrant(req, res) {
  const {
    code, // The authorization code from /authorize
    client_id,
    redirect_uri,
    code_verifier, // PKCE: The original random string
  } = req.body;

  // Validate required params
  if (!code || !client_id || !redirect_uri || !code_verifier) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters",
    });
  }

  // Retrieve stored code data
  const codes = JSON.parse(fs.readFileSync(codesPath, "utf8"));
  const codeData = codes[code];

  if (!codeData) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "Authorization code not found or already used",
    });
  }

  // Check if code is expired
  if (Date.now() > codeData.expires_at) {
    delete codes[code];
    fs.writeFileSync(codesPath, JSON.stringify(codes, null, 4));
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "Authorization code has expired",
    });
  }

  // Validate client_id matches
  if (codeData.client_id !== client_id) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "Client ID mismatch",
    });
  }

  // Validate redirect_uri matches
  if (codeData.redirect_uri !== redirect_uri) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "Redirect URI mismatch",
    });
  }

  // ============================================
  // PKCE Verification - This is the magic!
  // ============================================
  // The client sent code_challenge during /authorize
  // Now it sends code_verifier
  // We verify: SHA256(code_verifier) === code_challenge

  const isValidPKCE = pkceService.verifyCodeChallenge(
    code_verifier,
    codeData.code_challenge,
    codeData.code_challenge_method,
  );

  if (!isValidPKCE) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description:
        "PKCE verification failed - code_verifier does not match code_challenge",
    });
  }

  console.log("✅ PKCE verification successful!");

  // Delete the used code (codes are single-use)
  delete codes[code];
  fs.writeFileSync(codesPath, JSON.stringify(codes, null, 4));

  // Generate tokens
  const user = codeData.user;
  const scopes = codeData.scope.split(" ");

  // Access Token - Used to access protected resources
  const accessToken = tokenService.generateAccessToken(user, scopes);

  // Refresh Token - Used to get new access tokens
  const refreshToken = tokenService.generateRefreshToken();

  // Store refresh token (in production, store in database)
  refreshTokens.set(refreshToken, {
    user,
    scopes,
    client_id,
    created_at: Date.now(),
  });

  // ID Token - OIDC: Contains user identity
  let idToken = null;
  if (scopes.includes("openid")) {
    idToken = tokenService.generateIdToken(user, client_id, scopes);
  }

  console.log(`✅ Tokens issued for user: ${user.username}`);

  // Set refresh token as HTTP-only cookie
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,      // JavaScript can't access it (XSS protection)
    secure: false,       // Set to true in production (HTTPS only)
    sameSite: 'Lax',     // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/token'       // Only sent to /token endpoint
  });

  // Return tokens (refresh_token is in cookie, not body)
  res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 900, // 15 minutes in seconds
    scope: codeData.scope,
    ...(idToken && { id_token: idToken }),
  });
}

// ============================================
// Handle Refresh Token Grant
// ============================================
function handleRefreshTokenGrant(req, res) {
  const { client_id } = req.body;
  const refresh_token = req.cookies?.refresh_token; // From HTTP-only cookie

  if (!refresh_token) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing refresh_token",
    });
  }

  // Validate refresh token
  const tokenData = refreshTokens.get(refresh_token);

  if (!tokenData) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "Invalid refresh token",
    });
  }

  // Validate client_id matches
  if (tokenData.client_id !== client_id) {
    return res.status(400).json({
      error: "invalid_grant",
      error_description: "Client ID mismatch",
    });
  }

  // Generate new access token
  const accessToken = tokenService.generateAccessToken(
    tokenData.user,
    tokenData.scopes,
  );

  console.log(`✅ Access token refreshed for user: ${tokenData.user.username}`);

  res.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 900,
    scope: tokenData.scopes.join(" "),
  });
}

// ============================================
// GET /userinfo - OIDC Endpoint
// ============================================
// Returns user information based on access_token
// Similar to: accessing req.session.user in Basic Auth

exports.getUserInfo = (req, res) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "invalid_token",
      error_description: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.split(" ")[1];

  // Verify and decode token
  const decoded = tokenService.verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: "invalid_token",
      error_description: "Token is invalid or expired",
    });
  }

  // Return user info based on scopes
  const userInfo = {
    sub: decoded.sub, // Subject - unique user identifier
  };

  if (decoded.scope.includes("profile")) {
    userInfo.name = decoded.name;
    userInfo.username = decoded.username;
    userInfo.picture = decoded.picture;
  }

  if (decoded.scope.includes("email")) {
    userInfo.email = decoded.email;
  }

  if (decoded.scope.includes("admin") || decoded.role === "admin") {
    userInfo.role = decoded.role;
  }

  res.json(userInfo);
};