const mysql = require('mysql2/promise');
const config = require('./src/config');

async function setupDatabase() {
  console.log('Connecting to Aiven Database...');
  
  const pool = mysql.createPool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : null,
  });

  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected successfully!');

    console.log('Creating/Updating tables...');

    // 1. Create Users Table (Updated with created_at)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add created_at if it doesn't exist (in case table was already there)
    try {
      await connection.query('ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    } catch(e) { /* column likely already exists */ }
    
    console.log('- Table "users" ready.');

    // 2. Create Authorization Codes Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS authorization_codes (
        code VARCHAR(255) PRIMARY KEY,
        client_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        redirect_uri VARCHAR(255) NOT NULL,
        scope VARCHAR(255) NOT NULL,
        code_challenge VARCHAR(255) NOT NULL,
        code_challenge_method VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('- Table "authorization_codes" ready.');

    // 3. Create Deleted Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS deleted_users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        original_created_at TIMESTAMP NULL,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('- Table "deleted_users" ready.');

    // 4. Create Clients Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clients (
        client_id VARCHAR(255) PRIMARY KEY,
        client_secret VARCHAR(255) NOT NULL,
        redirect_uri VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL
      )
    `);
    console.log('- Table "clients" ready.');

    // Seed the default client if it doesn't exist
    await connection.query(`
      INSERT IGNORE INTO clients (client_id, client_secret, redirect_uri, name) 
      VALUES (?, ?, ?, ?)
    `, ['my-client-app', 'super-secret', 'http://localhost:3000/callback.html', 'Modern Auth Client']);
    console.log('- Default client seeded.');

    console.log('\n🌟 Database Overhaul Complete! Your Aiven DB is perfectly synced.');
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
