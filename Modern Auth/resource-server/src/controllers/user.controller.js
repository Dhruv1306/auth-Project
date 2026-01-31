// User Controller - Handles Protected Endpoints
// Similar to your dashboard route handler

const fs = require("fs");
const path = require("path");

const resourcesPath = path.join(__dirname, "../../data/resources.json");

// ============================================
// GET /api/profile
// ============================================
// Returns user profile from token
// In Basic Auth, this would be: res.json(req.session.user)

exports.getProfile = (req, res) => {
  // req.user was set by token middleware
  // Contains decoded token claims
  res.json({
    success: true,
    message: "Profile retrieved successfully",
    data: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      picture: req.user.picture,
    },
  });
};

// ============================================
// GET /api/dashboard
// ============================================
// Returns dashboard data
// Similar to your res.sendFile('./src/UI/${Role}/dashboard.html')

exports.getDashboard = (req, res) => {
  const resources = JSON.parse(fs.readFileSync(resourcesPath, "utf8"));

  res.json({
    success: true,
    message: "Dashboard data retrieved",
    user: {
      name: req.user.name,
      role: req.user.role,
    },
    data: resources.dashboard,
  });
};

// ============================================
// GET /api/admin
// ============================================
// Admin-only endpoint
// Like your /dashboard?role=admin with isAuthorized

exports.getAdminData = (req, res) => {
  const resources = JSON.parse(fs.readFileSync(resourcesPath, "utf8"));

  res.json({
    success: true,
    message: "Admin data retrieved",
    user: {
      name: req.user.name,
      role: req.user.role,
    },
    data: resources.adminData,
    stats: resources.stats,
  });
};

// ============================================
// GET /api/users
// ============================================
// Admin-only: List all users

exports.getAllUsers = (req, res) => {
  const resources = JSON.parse(fs.readFileSync(resourcesPath, "utf8"));

  res.json({
    success: true,
    data: resources.users,
  });
};

/*
 * COMPARISON:
 *
 * Basic Auth Dashboard Route:
 * ```javascript
 * app.get('/dashboard', isAuthenticated, isAuthorized, (req,res) => {
 *     const Role = req.query.role;
 *     return res.status(200).sendFile(`./src/UI/${Role}/dashboard.html`);
 * });
 * ```
 *
 * OAuth Resource Server:
 * - Token validation happens in middleware (not session check)
 * - User info comes from token (not session)
 * - Returns JSON data (API-first approach)
 * - Frontend handles rendering (SPA)
 *
 * This separation allows:
 * - Multiple clients (web, mobile, CLI)
 * - Microservices architecture
 * - Better scalability
 */
