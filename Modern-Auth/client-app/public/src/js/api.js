// This file runs while calling Protected Resources
/* Protected resources represents the "Resource's data", i.e, user's data. 
    If the client have the token only then give the access otherwise denied access.
    And "api.js" sends the token with each request to prove you're logged in.
    We can also name this file as "requests.js". (optional)
*/

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3002' 
    : 'https://auth-project-resource-server.onrender.com'; // Replace with your actual deployed Resource Server URL

async function fetchProtectedData() {
    const token = getAccessToken();
    
    if (!token) {
        alert('No access token! Please login first.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/user/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        document.getElementById('api-response').innerHTML = 
            '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
    } catch (error) {
        document.getElementById('api-response').textContent = 
            'Error: ' + error.message;
    }
}