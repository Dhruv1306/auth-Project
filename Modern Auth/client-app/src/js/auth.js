// OAuth 2.0 + PKCE Authentication Flow
// This handles the entire OAuth flow on the client side

const OAuth = {
  config: {
    // OAuth Configuration
    authServerUrl: "http://localhost:4000",
    clientId: "my-client-app",
    redirectUri: "http://localhost:3000/callback.html",
    scopes: "openid profile email",
  },

  // ============================================
  // Start Authorization Flow
  // ============================================
  // This is similar to clicking "Login" in Basic Auth
  // But instead of showing a form to fill, we redirect user to Auth Server

  startAuthorizationFlow: async () => {
    console.log("🚀 Starting OAuth 2.0 + PKCE flow...");

    // Step 1: Generate PKCE codes
    const codeVerifier = PKCE.generateCodeVerifier();
    const codeChallenge = await PKCE.generateCodeChallenge(codeVerifier);
    const state = PKCE.generateState();

    console.log("📝 PKCE Generated:");
    console.log("   code_verifier:", codeVerifier.substring(0, 20) + "...");
    console.log("   code_challenge:", codeChallenge.substring(0, 20) + "...");
    console.log("   state:", state);

    // Step 2: Store for later verification
    sessionStorage.setItem("pkce_code_verifier", codeVerifier);
    sessionStorage.setItem("pkce_code_challenge", codeChallenge);
    sessionStorage.setItem("oauth_state", state);

    // Step 3: Build authorization URL
    const authUrl = new URL(`${OAuth.config.authServerUrl}/authorize`);
    authUrl.searchParams.set("client_id", OAuth.config.clientId);
    authUrl.searchParams.set("redirect_uri", OAuth.config.redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", OAuth.config.scopes);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    console.log("🔗 Redirecting to:", authUrl.toString());

    // Step 4: Redirect to Authorization Server
    // This is where the user will log in (on the Auth Server, not our app!)
    window.location.href = authUrl.toString();
  },

  // ============================================
  // Exchange Authorization Code for Tokens
  // ============================================
  // Called from callback.html after user logs in
  // This is where PKCE verification happens

  exchangeCodeForTokens: async (code, codeVerifier) => {
    console.log("🔄 Exchanging code for tokens...");

    const response = await fetch(`${OAuth.config.authServerUrl}/token`, {
      method: "POST",
      credentials: "include", // Required to receive HTTP-only cookie
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: OAuth.config.clientId,
        redirect_uri: OAuth.config.redirectUri,
        code_verifier: codeVerifier, // PKCE: Proves we're the original requester
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.error);
    }

    const tokens = await response.json();
    console.log("✅ Tokens received:", Object.keys(tokens));

    return tokens;
  },

  // ============================================
  // Refresh Access Token
  // ============================================
  // Use refresh_token to get new access_token without re-login
  // Similar to session renewal in Basic Auth

  refreshToken: async () => {
    console.log("🔄 Refreshing access token...");

    // Refresh token is now stored in HTTP-only cookie
    // Browser will automatically send it with credentials: "include"

    const response = await fetch(`${OAuth.config.authServerUrl}/token`, {
      method: "POST",
      credentials: "include", // This sends the HTTP-only cookie!
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: OAuth.config.clientId,
        // refresh_token is sent automatically via HTTP-only cookie
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Refresh token might be expired - need to re-login
      if (error.error === "invalid_grant") {
        TokenStorage.clearTokens();
        window.location.href = "/";
        return;
      }
      throw new Error(error.error_description || error.error);
    }

    const tokens = await response.json();
    TokenStorage.saveTokens(tokens);

    console.log("✅ Access token refreshed");
    return tokens;
  },

  // ============================================
  // Logout
  // ============================================
  // Clear tokens and optionally notify auth server

  logout: () => {
    console.log("👋 Logging out...");

    // Clear tokens from storage
    TokenStorage.clearTokens();

    // Redirect to auth server logout (optional but recommended)
    const logoutUrl = new URL(`${OAuth.config.authServerUrl}/logout`);
    logoutUrl.searchParams.set(
      "post_logout_redirect_uri",
      "http://localhost:3000",
    );

    window.location.href = logoutUrl.toString();
  },
};

/*
 * FLOW COMPARISON:
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ BASIC AUTH (Your server.js)                                             │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ 1. User visits /login (your app)                                        │
 * │ 2. User enters email/password in YOUR form                              │
 * │ 3. POST /login to YOUR server                                           │
 * │ 4. Server validates credentials                                         │
 * │ 5. req.session.user = { username, role }                                │
 * │ 6. Redirect to /dashboard                                               │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ OAUTH 2.0 + PKCE (This implementation)                                  │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ 1. User clicks Login (your app)                                         │
 * │ 2. App generates PKCE codes                                             │
 * │ 3. Redirect to AUTH SERVER /authorize                                   │
 * │ 4. User enters email/password on AUTH SERVER form                       │
 * │ 5. Auth server validates credentials                                    │
 * │ 6. Redirect back to YOUR APP with auth_code                             │
 * │ 7. App exchanges auth_code + code_verifier for tokens                   │
 * │ 8. Auth server verifies PKCE, returns tokens                            │
 * │ 9. App stores tokens, shows dashboard                                   │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * KEY DIFFERENCE: Your app NEVER sees the user's password!
 */
