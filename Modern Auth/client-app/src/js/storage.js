// Token Storage Utilities
// Secure storage for OAuth tokens in the browser
// In production, consider using secure HTTP-only cookies for refresh tokens

const TokenStorage = {
  // Keys for localStorage
  // Note: refresh_token is stored in HTTP-only cookie, not localStorage
  KEYS: {
    ACCESS_TOKEN: "access_token",
    ID_TOKEN: "id_token",
    TOKEN_EXPIRY: "token_expiry",
  },

  // ============================================
  // Save Tokens
  // ============================================
  saveTokens: (tokens) => {
    if (tokens.access_token) {
      localStorage.setItem(TokenStorage.KEYS.ACCESS_TOKEN, tokens.access_token);
    }
    // ❌ Remove: localStorage.setItem(...REFRESH_TOKEN...)
    // Refresh token is now in HTTP-only cookie (browser handles it)

    if (tokens.id_token) {
      localStorage.setItem(TokenStorage.KEYS.ID_TOKEN, tokens.id_token);
    }
    if (tokens.expires_in) {
      const expiry = Date.now() + tokens.expires_in * 1000;
      localStorage.setItem(TokenStorage.KEYS.TOKEN_EXPIRY, expiry.toString());
    }

    console.log("✅ Tokens saved to storage");
  },

  // ============================================
  // Get Access Token
  // ============================================
  getAccessToken: () => {
    return localStorage.getItem(TokenStorage.KEYS.ACCESS_TOKEN);
  },

  // ============================================
  // Get Refresh Token
  // ============================================
  // Refresh token is now in HTTP-only cookie - JS can't access it (that's the point!)
  getRefreshToken: () => {
    return null; // Stored in HTTP-only cookie, not accessible to JS
  },

  // ============================================
  // Get ID Token
  // ============================================
  getIdToken: () => {
    return localStorage.getItem(TokenStorage.KEYS.ID_TOKEN);
  },

  // ============================================
  // Get All Tokens
  // ============================================
  getAllTokens: () => {
    return {
      access_token: TokenStorage.getAccessToken(),
      refresh_token: "[HTTP-only cookie]", // Not accessible to JS
      id_token: TokenStorage.getIdToken(),
      expiry: localStorage.getItem(TokenStorage.KEYS.TOKEN_EXPIRY),
    };
  },

  // ============================================
  // Check if Token is Expired
  // ============================================
  isTokenExpired: () => {
    const expiry = localStorage.getItem(TokenStorage.KEYS.TOKEN_EXPIRY);
    if (!expiry) return true;
    return Date.now() > parseInt(expiry);
  },

  // ============================================
  // Clear All Tokens
  // ============================================
  // Note: refresh_token cookie will be cleared by the auth server on logout
  clearTokens: () => {
    localStorage.removeItem(TokenStorage.KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TokenStorage.KEYS.ID_TOKEN);
    localStorage.removeItem(TokenStorage.KEYS.TOKEN_EXPIRY);
    console.log(
      "🗑️ Tokens cleared from storage (refresh_token cleared via server logout)",
    );
  },
};

/*
 * COMPARISON WITH BASIC AUTH:
 *
 * Basic Auth: Session stored on server, cookie references session ID
 * OAuth: Tokens stored on client, sent with each request
 *
 * Basic Auth Session:
 *   req.session.user = { username, email, role }
 *
 * OAuth Tokens:
 *   access_token = JWT containing { username, email, role, exp }
 *   refresh_token = opaque string to get new access_token
 *   id_token = JWT containing identity claims (OIDC)
 *
 * Security Note:
 * - localStorage is accessible to JavaScript (XSS risk)
 * - In production, consider:
 *   - HTTP-only cookies for refresh tokens
 *   - In-memory storage for access tokens
 *   - Token rotation on refresh
 */
