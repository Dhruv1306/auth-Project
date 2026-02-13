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
    return res.status(401).send("Invalid credentials");
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
  handleConsent,
};
