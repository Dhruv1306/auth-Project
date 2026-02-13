// For MySQL connection

const mysql = require('mysql2/promise');  // Load the MySQL package we installed & Use the "promise" version (allows async/await).
const config = require('./index');   // Looks for "index.js" file in the same folder & then our "config" contains all our settings.

// Now, create a connection pool
const pool = mysql.createPool({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;

/* NOTE : 

    1. Why "/promise"?

        - Without it: Uses callbacks (older, messy code)
        - With it: Uses async/await (modern, cleaner code)
*/