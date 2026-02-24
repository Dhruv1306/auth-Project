// This file handles the OAuth flow — starting login and exchanging the code for tokens.

// Configuration
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const config = {
  authorizationEndpoint: isLocal ? "http://localhost:3010/authorize" : "https://auth-project-auth-server.onrender.com/authorize",
  tokenEndpoint: isLocal ? "http://localhost:3010/token" : "https://auth-project-auth-server.onrender.com/token",
  clientId: "my-client-app",
  redirectUri: isLocal ? "http://localhost:3000/callback.html" : `${window.location.origin}/callback.html`,
  scope: "openid profile",
};

// Step 1: Start the login process
async function login() {
  // Generate PKCE values
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store verifier for later (we'll need it to exchange the code)
  storeCodeVerifier(codeVerifier);

  // Build the authorization URL
  const authUrl = new URL(config.authorizationEndpoint);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("client_id", config.clientId);
  authUrl.searchParams.append("redirect_uri", config.redirectUri);
  authUrl.searchParams.append("scope", config.scope);
  authUrl.searchParams.append("code_challenge", codeChallenge);
  authUrl.searchParams.append("code_challenge_method", "S256");

  // Redirect user to authorization server
  window.location.href = authUrl.toString();
}

// Step 2: Exchange authorization code for tokens (called from callback.html)
async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const error = urlParams.get("error");

  if (error) {
    console.error("Authorization error:", error);
    return { success: false, error };
  }

  if (!code) {
    return { success: false, error: "No authorization code received" };
  }

  // Get the stored code verifier
  const codeVerifier = getCodeVerifier();

  // Exchange code for tokens
  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();

  if (data.access_token) {
    storeTokens(data.access_token, data.id_token);
    clearCodeVerifier();
    return { success: true };
  }

  return { success: false, error: data.error };
}

// Logout — clears all tokens and replaces history to prevent back-button bypass
function logout() {
  // Save user's name before clearing tokens (for the logout toast)
  let firstName = 'User';
  try {
    const idToken = sessionStorage.getItem('id_token');
    if (idToken) {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const name = payload.name || payload.email || 'User';
      firstName = name.split(' ')[0];
    }
  } catch(e) {}

  clearTokens();
  // Use replace() instead of href to remove dashboard from browser history
  window.location.replace('/?logged_out=true&name=' + encodeURIComponent(firstName));
}

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
