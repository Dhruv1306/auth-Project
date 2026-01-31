// API Client for Resource Server
// Makes authenticated requests to protected resources

const API = {
  baseUrl: "http://localhost:5000",  // Resource Server URL

  // ============================================
  // Make Authenticated Request
  // ============================================
  // Adds Bearer token to Authorization header
  // This is how OAuth authentication works for API calls

  request: async (endpoint, options = {}) => {
    const accessToken = TokenStorage.getAccessToken();
    if (!accessToken){ throw new Error("Not authenticated"); }

    if (TokenStorage.isTokenExpired()) {   // Otherwise check if token is expired
      console.log("⚠️ Token expired, refreshing...");
      try {
        await OAuth.refreshToken();
      } catch (error) {                   // Refresh failed, redirect to login
        window.location.href = "/";    // This is client-side (browser) JavaScript, not server-side code. Therefore, we can't use "res.redirect('/');".
        throw new Error("Session expired");
      }
    }

    // Make request with Bearer token
    // This is the OAuth equivalent of sending session cookie
    const response = await fetch(`${API.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${TokenStorage.getAccessToken()}`,      // 'Authorization': 'Bearer <access_token>'
        "Content-Type": "application/json",
      },
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.log("⚠️ Unauthorized, trying token refresh...");
      try {
        await OAuth.refreshToken();
        // Retry the request with new token
        return API.request(endpoint, options);
      } catch (error) {
        window.location.href = "/";
        throw new Error("Session expired");
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }
    return response.json();
  },

  // ============================================
  // Get User Profile
  // ============================================
  // Protected endpoint - requires valid access token

  getProfile: async () => {
    return API.request("/api/profile");
  },

  // ============================================
  // Get User Dashboard Data
  // ============================================

  getDashboard: async () => {
    return API.request("/api/dashboard");
  },

  // ============================================
  // Get Admin Data
  // ============================================
  // Requires admin role in token

  getAdminData: async () => {
    return API.request("/api/admin");
  },
};

/*
 * COMPARISON WITH BASIC AUTH:
 *
 * Basic Auth (Your Code):
 *   // Session cookie sent automatically
 *   fetch('/dashboard')
 *
 *   // Server checks:
 *   const VISA = res.locals.VISA;
 *   if(VISA) return next();
 *
 * OAuth 2.0:
 *   // Must manually add token
 *   fetch('/api/profile', {
 *     headers: {
 *       'Authorization': 'Bearer <access_token>'
 *     }
 *   })
 *
 *   // Server validates JWT:
 *   const decoded = jwt.verify(token, secret);
 *   if(decoded) return next();
 *
 * BENEFITS OF OAUTH:
 * - Stateless: Server doesn't need to store sessions
 * - Scalable: Any server with the secret can validate tokens
 * - Cross-domain: Token works across different domains
 * - Fine-grained: Scopes control access to specific resources
 */

/* NOTE:
  - This file runs in the browser (it's loaded via <script> in our HTML).
  - "window.location.href" is the browser's way to navigate to a new page.
*/