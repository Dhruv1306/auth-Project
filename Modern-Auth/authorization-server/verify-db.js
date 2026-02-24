const mysql = require('mysql2/promise');
const config = require('./src/config');

async function verifyDatabase() {
  console.log('Connecting to Aiven Database to verify tables...');
  
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
    console.log('✅ Connected successfully!\n');

    const [tables] = await connection.query('SHOW TABLES');
    const tableList = tables.map(t => Object.values(t)[0]);
    
    console.log('Current Tables in Database:');
    tableList.forEach(name => console.log(`- ${name}`));
    console.log('');

    const expectedTables = ['users', 'authorization_codes', 'deleted_users', 'clients'];
    
    for (const table of expectedTables) {
      if (tableList.includes(table)) {
        console.log(`Checking columns for "${table}"...`);
        const [columns] = await connection.query(`DESCRIBE ${table}`);
        columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
      } else {
        console.log(`❌ Table "${table}" is MISSING!`);
      }
      console.log('');
    }

    if (tableList.includes('clients')) {
      console.log('Verifying seeded clients...');
      const [clients] = await connection.query('SELECT client_id, name FROM clients');
      clients.forEach(c => console.log(`- Found Client: ${c.name} (${c.client_id})`));
    }

    console.log('\n🌟 Verification Complete!');
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Verification Error:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
