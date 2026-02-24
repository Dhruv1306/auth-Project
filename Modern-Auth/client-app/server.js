const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// === SECURITY: Prevent browser from caching protected pages ===
// This stops the back-button from showing dashboard after logout
app.use('/dashboard.html', (req, res, next) => {
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
    });
    next();
});

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve JS and CSS from 'src' folder
app.use('/src', express.static(path.join(__dirname, 'src')));

// Default route - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Client App running at http://localhost:${PORT}`);
});