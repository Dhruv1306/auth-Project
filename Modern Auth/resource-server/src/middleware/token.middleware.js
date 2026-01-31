// Token Middleware - Validates Access Tokens
// This replaces your isAuthenticated and isAuthorized middlewares

const jwt = require("jsonwebtoken");
const config = require("../config");

// ============================================
// Validate Token Middleware
// ============================================
// This is the OAuth equivalent of your isAuthenticated
// Instead of checking req.session.user, we validate the JWT

exports.validateToken = (req, res, next) => {
  // Extract token from Authorization header
  // Format: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "missing_token",
      message: "Authorization header is required",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "invalid_token_format",
      message: "Authorization header must use Bearer scheme",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify token signature and expiry
    // This is like checking if session is valid
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // Validate issuer (who created this token)
    if (decoded.iss !== config.EXPECTED_ISSUER) {
      return res.status(401).json({
        error: "invalid_issuer",
        message: "Token was not issued by trusted authorization server",
      });
    }

    // Attach user info to request (like res.locals.VISA in your code)
    // Now available as req.user in route handlers
    req.user = {
      id: decoded.sub,
      username: decoded.username,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      scope: decoded.scope,
      picture: decoded.picture,
    };

    console.log(
      `✅ Token validated for: ${req.user.username} (${req.user.role})`,
    );

    next();
  } catch (error) {
    // Token validation failed
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "token_expired",
        message:
          "Access token has expired. Use refresh token to get a new one.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "invalid_token",
        message: "Token signature is invalid",
      });
    }

    return res.status(401).json({
      error: "token_error",
      message: error.message,
    });
  }
};

// ============================================
// Require Role Middleware
// ============================================
// This is the OAuth equivalent of your isAuthorized
// Checks if user has required role in their token

exports.requireRole = (requiredRole) => {
  return (req, res, next) => {
    // User info was attached by validateToken
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        error: "unauthorized",
        message: "Authentication required",
      });
    }

    // Check role (like your VISA.role check)
    if (user.role !== requiredRole) {
      return res.status(403).json({
        error: "forbidden",
        message: `This resource requires '${requiredRole}' role. You have '${user.role}' role.`,
      });
    }

    next();
  };
};

// ============================================
// Require Scope Middleware
// ============================================
// OAuth-specific: Check if token has required scopes

exports.requireScope = (requiredScope) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !user.scope) {
      return res.status(401).json({
        error: "unauthorized",
        message: "Authentication required",
      });
    }

    const scopes = Array.isArray(user.scope)
      ? user.scope
      : user.scope.split(" ");

    if (!scopes.includes(requiredScope)) {
      return res.status(403).json({
        error: "insufficient_scope",
        message: `This resource requires '${requiredScope}' scope`,
      });
    }

    next();
  };
};

/*
 * COMPARISON WITH BASIC AUTH:
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ YOUR BASIC AUTH                                                          │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ const isAuthenticated = (req,res,next) => {                              │
 * │     const VISA = res.locals.VISA;   // From session                      │
 * │     if(VISA) return next();                                              │
 * │     return res.redirect('/login?expired=true');                          │
 * │ }                                                                        │
 * │                                                                          │
 * │ const isAuthorized = (req,res,next) => {                                 │
 * │     const VISA = res.locals.VISA;                                        │
 * │     if(VISA.role != queryRole) return res.status(401).send(...);         │
 * │     if(VISA) return next();                                              │
 * │ }                                                                        │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ OAUTH TOKEN VALIDATION                                                   │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ exports.validateToken = (req, res, next) => {                            │
 * │     const token = req.headers.authorization.split(' ')[1];               │
 * │     const decoded = jwt.verify(token, secret);  // Validates signature   │
 * │     req.user = decoded;  // User info from token                         │
 * │     next();                                                              │
 * │ }                                                                        │
 * │                                                                          │
 * │ exports.requireRole = (role) => (req, res, next) => {                    │
 * │     if(req.user.role !== role) return res.status(403).send(...);         │
 * │     next();                                                              │
 * │ }                                                                        │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * KEY DIFFERENCE:
 * - Basic Auth: Server looks up session data from session store
 * - OAuth: User data is IN the token itself (self-contained)
 */
