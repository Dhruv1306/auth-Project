// Configuration for Authorization Server
// Similar to how you might configure session settings in Basic Auth

module.exports = {
  // Issuer - The identity of this auth server (used in tokens)
  ISSUER: "http://localhost:4000",

  // JWT Secret - Used to sign tokens (in production, use RSA keys)
  JWT_SECRET: "your-super-secret-jwt-key-change-in-production",

  // Token Expiry Times
  ACCESS_TOKEN_EXPIRY: "15m", // Short-lived (like your 1 min session, but standard is 15min)
  REFRESH_TOKEN_EXPIRY: "7d", // Long-lived for getting new access tokens
  ID_TOKEN_EXPIRY: "1h", // OIDC ID token
  AUTH_CODE_EXPIRY: 1000 * 60 * 5, // 5 minutes (auth codes should be very short-lived)

  // PKCE Settings
  CODE_CHALLENGE_METHOD: "S256", // SHA-256 (more secure than 'plain')

  // Scopes Explanation:
  // - openid: Required for OIDC, returns id_token
  // - profile: Access to name, username
  // - email: Access to email
  // - admin: Custom scope for admin resources (like your role-based access)
  VALID_SCOPES: ["openid", "profile", "email", "admin"],
};
