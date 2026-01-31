// Auth Middleware for Authorization Server
// Similar to your isAuthenticated in Basic Auth

exports.isLoggedIn = (req, res, next) => {
  // Check if user is logged in (like your VISA check)
  if (req.session.user) {
    return next();
  }

  // Redirect to login
  res.redirect("/login");
};
