const db = require('../config/database');

/**
 * Keep-Alive Heartbeat
 * Runs a simple query every few minutes to prevent the database from hibernating.
 */
function startHeartbeat(intervalMinutes = 1) {
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`💓 Heartbeat started: Pinging database every ${intervalMinutes} minute(s) to keep it awake.`);

    setInterval(async () => {
        try {
            // "SELECT 1" is the lightest possible query to check if DB is alive
            await db.query('SELECT 1');
            console.log('💓 Heartbeat: Database pinged successfully.');
        } catch (err) {
            console.error('💔 Heartbeat Error:', err.message);
        }
    }, intervalMs);
}

module.exports = { startHeartbeat };
