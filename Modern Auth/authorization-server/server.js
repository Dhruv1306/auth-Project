// Authorization Server - OAuth2.0 + PKCE + OIDC
// This is like Google, GitHub, Auth0 - it issues tokens
// Port: 4000

const express = require("express");
const session = require("express-session");
const cors = require("cors");
const path = require("path");
const app = express();
const PORT = 4000;

// Import routes
const oauthRoutes = require("./src/routes/oauth.routes");
const cookieParser = require('cookie-parser');

// Middleware
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:3000", // Client app
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "src/views")));

// Session for login state (similar to your Basic Auth)
app.use(
  session({
    secret: "AUTH_SERVER_SECRET",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 10, // 10 minutes
    },
  }),
);

// OAuth2.0 Routes
app.use("/", oauthRoutes);

// OIDC Discovery Endpoint (/.well-known/openid-configuration)
// This tells clients about the auth server's capabilities
app.get("/.well-known/openid-configuration", (req, res) => {
  const config = require("./src/config");
  res.json({
    issuer: config.ISSUER,
    authorization_endpoint: `${config.ISSUER}/authorize`,
    token_endpoint: `${config.ISSUER}/token`,
    userinfo_endpoint: `${config.ISSUER}/userinfo`,
    jwks_uri: `${config.ISSUER}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["HS256"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: ["none"], // Public client (PKCE)
    claims_supported: ["sub", "name", "email", "role"],
  });
});

app.listen(PORT, () => {
  console.log(`🔐 Authorization Server running on http://localhost:${PORT}`);
  console.log(
    `📋 OIDC Discovery: http://localhost:${PORT}/.well-known/openid-configuration`,
  );
});
