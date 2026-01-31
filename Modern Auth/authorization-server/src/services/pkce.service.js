// PKCE Service - Proof Key for Code Exchange
// This is the security layer that prevents authorization code interception

const crypto = require("crypto");

// ============================================
// Verify Code Challenge
// ============================================
// The client sends:
//   1. code_challenge during /authorize (hashed value)
//   2. code_verifier during /token (original value)
// We verify: hash(code_verifier) === code_challenge

exports.verifyCodeChallenge = (codeVerifier, codeChallenge, method) => {
  if (method === "S256") {
    // SHA-256 method (recommended)
    // 1. Hash the verifier with SHA-256
    // 2. Base64URL encode it
    // 3. Compare with the challenge

    const hash = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64")
      // Convert to base64url (URL-safe base64)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    console.log("PKCE Verification:");
    console.log("  code_verifier:", codeVerifier.substring(0, 20) + "...");
    console.log("  Expected challenge:", codeChallenge);
    console.log("  Computed challenge:", hash);
    console.log("  Match:", hash === codeChallenge);

    return hash === codeChallenge;
  } else if (method === "plain") {
    // Plain method (not recommended, but sometimes used)
    // code_verifier === code_challenge
    return codeVerifier === codeChallenge;
  }

  return false;
};

// ============================================
// Generate Code Verifier (for testing)
// ============================================
// This is normally done on the client side
// A random string between 43-128 characters

exports.generateCodeVerifier = () => {
  return crypto
    .randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

// ============================================
// Generate Code Challenge (for testing)
// ============================================
// SHA256 hash of the verifier, base64url encoded

exports.generateCodeChallenge = (codeVerifier) => {
  return crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};
