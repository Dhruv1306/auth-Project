// PKCE prevents authorization code interception attacks.
// It provides the "Code verifier" & "Code challenge"

// 1. Generate a random code verifier (43-128 chars)
function generateCodeVerifier(){
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);  // A built-in browser API that fills the array with cryptographically secure random numbers.
    return base64UrlEncode(array);
}

// 2. Base64 URL encode (no +, /, or = characters)
function base64UrlEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// "Base64" converts binary data into a text string using 64 safe characters ( includes Alpha-numeric values).
// The code challenge is sent in a URL. If we used regular "Base64" with "+" or "/", the URL would break!
// Therefore, we are replacing some characters with other. 


// 3. Generate code challenge from verifier (SHA-256 hash)
async function generateCodeChallenge(verifier){
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);   // Creates a SHA-256 hash of the data
    return base64UrlEncode(hash);
}