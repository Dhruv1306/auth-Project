// PKCE (Proof Key for Code Exchange) Implementation
// This is the client-side PKCE code generation
// PKCE adds security by ensuring only the original client can exchange the code

const PKCE = {
  // ============================================
  // Generate Code Verifier
  // ============================================
  // A random string between 43-128 characters
  // This is kept SECRET on the client and sent during token exchange

  generateCodeVerifier: () => {
    // Create random bytes
    const array = new Uint8Array(32);   // Creates a random 32-byte string
    crypto.getRandomValues(array);     // generates secure random bytes
    return base64UrlEncode(array);    // Convert to base64url & return
  },

  // ============================================
  // Generate Code Challenge
  // ============================================
  // SHA-256 hash of the code_verifier, base64url encoded
  // This is sent to the auth server during /authorize
  // The auth server stores it and compares later

  generateCodeChallenge: async (codeVerifier) => {
    // Hash the verifier with SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hash = await crypto.subtle.digest("SHA-256", data);   // computes SHA-256 hash
    return base64UrlEncode(new Uint8Array(hash));   // Convert to base64url & return
  },

  // ============================================
  // Generate State (CSRF Protection)(Cross-Site Request Forgery)
  // ============================================
  // Random string to prevent CSRF attacks
  // Must match between request and callback

  generateState: () => {
    const array = new Uint8Array(16);   // create an array, which can contain a 16 bytes string.
    crypto.getRandomValues(array);
    return base64UrlEncode(array);
  },
};

// ============================================
// Helper: Base64 URL Encode
// ============================================
// Standard base64 with URL-safe characters

function base64UrlEncode(arrayBuffer) {
  let str = "";
  const bytes = new Uint8Array(arrayBuffer);
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, "-") // Replace + with -
    .replace(/\//g, "_") // Replace / with _
    .replace(/=/g, ""); // Remove padding =
}

/*
 * HOW PKCE WORKS:
 *
 * 1. Client generates random code_verifier (secret)
 * 2. Client creates code_challenge = SHA256(code_verifier)
 * 3. Client sends code_challenge to /authorize
 * 4. Auth server stores code_challenge with auth_code
 * 5. User logs in, auth server redirects with auth_code
 * 6. Client sends auth_code + code_verifier to /token
 * 7. Auth server verifies: SHA256(code_verifier) === stored code_challenge
 * 8. If match, tokens are issued
 *
 * WHY THIS IS SECURE:
 * - Attacker intercepts auth_code? Can't use it without code_verifier
 * - code_challenge can't be reversed to get code_verifier (SHA256 is one-way)
 * - Each flow has unique verifier/challenge pair
 */