// OAuth2.0 Routes
// These are the standard OAuth2.0 endpoints

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const tokenController = require("../controllers/token.controller");
const authMiddleware = require("../middleware/auth.middleware");

// ============================================
// AUTHORIZATION ENDPOINT - /authorize
// ============================================
// Step 1: Client redirects user here to login
// Similar to: User visiting your /login page
router.get("/authorize", authController.authorize);

// ============================================
// LOGIN ENDPOINT - /login
// ============================================
// Step 2: User submits credentials
// Similar to: Your POST /login in Basic Auth
router.get("/login", authController.showLoginPage);
router.post("/login", authController.handleLogin);

// ============================================
// CONSENT ENDPOINT - /consent
// ============================================
// Step 3: User approves scopes (optional in some flows)
router.get( "/consent", authMiddleware.isLoggedIn, authController.showConsentPage );
router.post( "/consent", authMiddleware.isLoggedIn, authController.handleConsent );

// ============================================
// TOKEN ENDPOINT - /token
// ============================================
// Step 4: Client exchanges auth_code for tokens
// This is NEW in OAuth - doesn't exist in Basic Auth
router.post("/token", tokenController.exchangeToken);

// ============================================
// REFRESH TOKEN ENDPOINT - /token (same endpoint)
// ============================================
// Step 5: Client gets new access_token using refresh_token
// Similar to: Session renewal (but more secure)

// ============================================
// USERINFO ENDPOINT - /userinfo (OIDC)
// ============================================
// Returns user profile information
// Similar to: Accessing req.session.user in Basic Auth
router.get("/userinfo", tokenController.getUserInfo);

// ============================================
// LOGOUT ENDPOINT - /logout
// ============================================
router.get("/logout", authController.logout);
router.post("/logout", authController.logout);

module.exports = router;
