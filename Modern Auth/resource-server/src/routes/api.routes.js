// API Routes - Protected Endpoints
// Similar to your /dashboard route in Basic Auth

const express = require("express");
const router = express.Router();
const tokenMiddleware = require("../middleware/token.middleware");
const userController = require("../controllers/user.controller");

// ============================================
// All routes below require valid access_token
// ============================================
// This is like your isAuthenticated middleware
router.use(tokenMiddleware.validateToken);

// ============================================
// GET /api/profile
// ============================================
// Returns user profile from token
// Similar to: accessing req.session.user
router.get("/profile", userController.getProfile);

// ============================================
// GET /api/dashboard
// ============================================
// Returns dashboard data
// Similar to: your GET /dashboard route
router.get("/dashboard", userController.getDashboard);

// ============================================
// GET /api/admin
// ============================================
// Requires admin role - like your isAuthorized
router.get(
  "/admin",
  tokenMiddleware.requireRole("admin"),
  userController.getAdminData,
);

// ============================================
// GET /api/users (Admin only)
// ============================================
router.get(
  "/users",
  tokenMiddleware.requireRole("admin"),
  userController.getAllUsers,
);

module.exports = router;
