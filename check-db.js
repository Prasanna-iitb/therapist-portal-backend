import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkData() {
  try {
    // Get customer IDs
    console.log('\n=== Customer IDs in sessions table ===');
    const customers = await pool.query('SELECT DISTINCT customer_id FROM sessions LIMIT 5');
    console.log(customers.rows);

    // Get sample sessions
    console.log('\n=== Sample sessions ===');
    const sessions = await pool.query('SELECT session_id, customer_id, client_id, session_date, status FROM sessions LIMIT 3');
    console.log(sessions.rows);

    // Get clients
    console.log('\n=== Sample clients ===');
    const clients = await pool.query('SELECT customer_id, client_id, name FROM clients LIMIT 3');
    console.log(clients.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkData();
