// Auth Controller - Handles Authorization & Login
// Similar to your login route in Basic Auth, but more complex

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");
const pkceService = require("../services/pkce.service");

// Path to data files
const usersPath = path.join(__dirname, "../../data/users.json");
const clientsPath = path.join(__dirname, "../../data/clients.json");
const codesPath = path.join(__dirname, "../../data/codes.json");

// ============================================
// GET /authorize
// ============================================
// This is where OAuth flow begins
// Client redirects user here with these params:
// - client_id: Which app is requesting access
// - redirect_uri: Where to send user after login
// - response_type: 'code' for auth code flow
// - scope: What permissions are requested
// - state: CSRF protection
// - code_challenge: PKCE challenge
// - code_challenge_method: 'S256' or 'plain'

exports.authorize = (req, res) => {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    code_challenge,
    code_challenge_method,
  } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type || !code_challenge) {
    return res.status(400).json({
      error: "invalid_request",
      error_description:
        "Missing required parameters: client_id, redirect_uri, response_type, code_challenge",
    });
  }

  // Validate response_type
  if (response_type !== "code") {
    return res.status(400).json({
      error: "unsupported_response_type",
      error_description: 'Only "code" response type is supported',
    });
  }

  // Validate client
  const clients = JSON.parse(fs.readFileSync(clientsPath, "utf8"));
  const client = clients.find((c) => c.client_id === client_id);

  if (!client) {
    return res.status(400).json({
      error: "invalid_client",
      error_description: "Client not registered",
    });
  }

  // Validate redirect_uri
  if (!client.redirect_uris.includes(redirect_uri)) {
    return res.status(400).json({
      error: "invalid_redirect_uri",
      error_description: "Redirect URI not registered for this client",
    });
  }

  // Store auth request in session (to use after login)
  req.session.authRequest = {
    client_id,
    redirect_uri,
    response_type,
    scope: scope || "openid",
    state,
    code_challenge,
    code_challenge_method: code_challenge_method || "S256",
  };

  // Check if user is already logged in
  if (req.session.user) {
    // Skip login, go to consent (or generate code if consent not required)
    return res.redirect("/consent");
  }

  // Redirect to login page
  res.redirect("/login");
};

// ============================================
// GET /login
// ============================================
exports.showLoginPage = (req, res) => {
  // Make sure we have an auth request
  if (!req.session.authRequest) {
    return res
      .status(400)
      .send(
        "No authorization request found. Please start from the client app.",
      );
  }
  res.sendFile(path.join(__dirname, "../views/login.html"));
};

// ============================================
// POST /login
// ============================================
// Similar to your POST /login in Basic Auth
exports.handleLogin = (req, res) => {
  const { email, password } = req.body;

  // Read users (just like your Basic Auth)
  const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));

  // Find user by email
  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(401).send(`
            <script>
                alert("User doesn't exist");
                window.location.href = '/login';
            </script>
        `);
  }

  if (user.password !== password) {
    return res.status(401).send(`
            <script>
                alert("Wrong password");
                window.location.href = '/login';
            </script>
        `);
  }

  // Store user in session (like your req.session.user)
  req.session.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.isAdmin ? "admin" : "user",
    profile: user.profile,
  };

  // Redirect to consent page
  res.redirect("/consent");
};

// ============================================
// GET /consent
// ============================================
exports.showConsentPage = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/consent.html"));
};

// ============================================
// POST /consent
// ============================================
// User approved the scopes - generate auth code
exports.handleConsent = (req, res) => {
  const { approved } = req.body;
  const authRequest = req.session.authRequest;
  const user = req.session.user;

  if (!authRequest) {
    return res.status(400).json({ error: "No authorization request found" });
  }

  if (approved !== "true") {
    // User denied - redirect with error
    const redirectUrl = new URL(authRequest.redirect_uri);
    redirectUrl.searchParams.set("error", "access_denied");
    redirectUrl.searchParams.set(
      "error_description",
      "User denied the request",
    );
    if (authRequest.state) {
      redirectUrl.searchParams.set("state", authRequest.state);
    }
    return res.redirect(redirectUrl.toString());
  }

  // Generate authorization code
  const authCode = uuidv4();

  // Store the code with associated data (expires in 5 minutes)
  const codes = JSON.parse(fs.readFileSync(codesPath, "utf8"));
  codes[authCode] = {
    client_id: authRequest.client_id,
    redirect_uri: authRequest.redirect_uri,
    scope: authRequest.scope,
    code_challenge: authRequest.code_challenge,
    code_challenge_method: authRequest.code_challenge_method,
    user: user,
    created_at: Date.now(),
    expires_at: Date.now() + config.AUTH_CODE_EXPIRY,
  };
  fs.writeFileSync(codesPath, JSON.stringify(codes, null, 4));

  // Clear auth request from session
  delete req.session.authRequest;

  // Redirect back to client with authorization code
  const redirectUrl = new URL(authRequest.redirect_uri);
  redirectUrl.searchParams.set("code", authCode);
  if (authRequest.state) {
    redirectUrl.searchParams.set("state", authRequest.state);
  }

  console.log(`✅ Auth code generated for user: ${user.username}`);
  res.redirect(redirectUrl.toString());
};

// ============================================
// GET/POST /logout
// ============================================
exports.logout = (req, res) => {
  const redirectUri =
    req.query.post_logout_redirect_uri || "http://localhost:3000";

  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
    }
    res.redirect(redirectUri);
  });
};
