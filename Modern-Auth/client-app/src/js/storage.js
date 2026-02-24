// It'll contains the functions to store/retrieve the verifier
// It has 3 steps : store, get & clear

// Store the code verifier (needed later to exchange code for tokens)
function storeCodeVerifier(verifier) {
    sessionStorage.setItem('code_verifier', verifier);
}

function getCodeVerifier() {
    return sessionStorage.getItem('code_verifier');
}

function clearCodeVerifier() {
    sessionStorage.removeItem('code_verifier');
}

// Token storage
function storeTokens(accessToken, idToken) {
    sessionStorage.setItem('access_token', accessToken);
    if (idToken) sessionStorage.setItem('id_token', idToken);
}

function getAccessToken() {
    return sessionStorage.getItem('access_token');
}

function clearTokens() {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('id_token');
    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('login_toast_shown');
}