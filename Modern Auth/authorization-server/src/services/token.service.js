// Token Service - JWT Generation and Verification
// This creates the tokens that replace your session

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config");

// ============================================
// Generate Access Token
// ============================================
// This is like creating req.session.user but as a JWT
// The token contains claims (data) that are signed

exports.generateAccessToken = (user, scopes) => {
  const payload = {
    // Standard JWT Claims
    iss: config.ISSUER, // Issuer - who created this token
    sub: user.id, // Subject - unique user identifier
    aud: "resource-server", // Audience - who should accept this token
    iat: Math.floor(Date.now() / 1000), // Issued At - when token was created

    // Custom Claims (like your session data)
    scope: scopes, // Permissions granted
    username: user.username,
    email: user.email,
    name: user.profile?.name || user.username,
    role: user.role, // admin or user (like your isAdmin)
    picture: user.profile?.picture,
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.ACCESS_TOKEN_EXPIRY,
  });
};

// ============================================
// Generate ID Token (OIDC)
// ============================================
// Contains identity information about the user
// This is what makes it OpenID Connect, not just OAuth2.0

exports.generateIdToken = (user, clientId, scopes) => {
  const payload = {
    // Standard OIDC Claims
    iss: config.ISSUER,
    sub: user.id,
    aud: clientId,
    iat: Math.floor(Date.now() / 1000),
    auth_time: Math.floor(Date.now() / 1000),

    // Identity Claims (based on scopes)
    ...(scopes.includes("profile") && {
      name: user.profile?.name || user.username,
      preferred_username: user.username,
      picture: user.profile?.picture,
    }),
    ...(scopes.includes("email") && {
      email: user.email,
      email_verified: true,
    }),

    // Custom claim for role
    role: user.role,
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.ID_TOKEN_EXPIRY,
  });
};

// ============================================
// Generate Refresh Token
// ============================================
// A random string used to get new access tokens
// Unlike access_token, this is opaque (not a JWT)

exports.generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

// ============================================
// Verify Access Token
// ============================================
// Used by Resource Server to validate tokens
// Similar to: checking if req.session.user exists

exports.verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
};
