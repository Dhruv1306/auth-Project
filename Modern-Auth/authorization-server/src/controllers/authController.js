const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const { verifyCodeChallenge } = require("../services/pkceService");
const path = require("path");

// Render login page with EJS
async function showLogin(req, res) {
  res.render("login", {
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri,
    scope: req.query.scope,
    code_challenge: req.query.code_challenge,
    code_challenge_method: req.query.code_challenge_method,
    error: req.query.error || null,
  });
}

// Handle login form POST
async function handleLogin(req, res) {
  const {
    email,
    password,
    client_id,
    redirect_uri,
    scope,
    code_challenge,
    code_challenge_method,
  } = req.body;

  // Find user
  const [users] = await db.query(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
  );
  if (users.length === 0) {
    // Re-render login page with error instead of plain text
    return res.status(401).render("login", {
      client_id,
      redirect_uri,
      scope,
      code_challenge,
      code_challenge_method,
      error: "Invalid email or password. Please try again.",
    });
  }
  const user = users[0];

  // Render consent page with EJS and pass user and OAuth info
  res.render("consent", {
    client_id,
    redirect_uri,
    scope,
    user,
    code_challenge,
    code_challenge_method,
  });
}

// Render registration page
async function showRegister(req, res) {
  res.render("register", {
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri,
    scope: req.query.scope,
    code_challenge: req.query.code_challenge,
    code_challenge_method: req.query.code_challenge_method,
    error: req.query.error || null,
  });
}

// Handle registration form POST
async function handleRegister(req, res) {
  const {
    name,
    email,
    password,
    confirm_password,
    client_id,
    redirect_uri,
    scope,
    code_challenge,
    code_challenge_method,
  } = req.body;

  // Build OAuth params for re-rendering on error
  const oauthParams = { client_id, redirect_uri, scope, code_challenge, code_challenge_method };

  // Validation: passwords must match
  if (password !== confirm_password) {
    return res.status(400).render("register", {
      ...oauthParams,
      error: "Passwords do not match.",
    });
  }

  // Validation: password minimum length
  if (password.length < 6) {
    return res.status(400).render("register", {
      ...oauthParams,
      error: "Password must be at least 6 characters long.",
    });
  }

  // Check if user already exists
  const [existingUsers] = await db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
  );
  if (existingUsers.length > 0) {
    return res.status(409).render("register", {
      ...oauthParams,
      error: "An account with this email already exists. Please sign in instead.",
    });
  }

  // Insert new user into database
  const userId = "user-" + uuidv4().split("-")[0]; // Generate a unique user ID
  await db.query(
    "INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)",
    [userId, email, password, name],
  );

  // After successful registration, redirect to login page with success message
  const loginUrl = `/authorize?client_id=${encodeURIComponent(client_id)}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=${encodeURIComponent(scope)}&code_challenge=${encodeURIComponent(code_challenge)}&code_challenge_method=${encodeURIComponent(code_challenge_method)}&registered=true`;
  res.redirect(loginUrl);
}

// Handle consent POST
async function handleConsent(req, res) {
  const {
    client_id,
    redirect_uri,
    scope,
    user_id,
    code_challenge,
    code_challenge_method,
  } = req.body;

  // Generate authorization code
  const code = uuidv4();
  const expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

  // Store code in DB
  await db.query(
    "INSERT INTO authorization_codes (code, client_id, user_id, redirect_uri, scope, code_challenge, code_challenge_method, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      code,
      client_id,
      user_id,
      redirect_uri,
      scope,
      code_challenge,
      code_challenge_method,
      expires_at,
    ],
  );

  // Redirect back to client with code
  res.redirect(`${redirect_uri}?code=${code}`);
}

module.exports = {
  showLogin,
  handleLogin,
  showRegister,
  handleRegister,
  handleConsent,
};
