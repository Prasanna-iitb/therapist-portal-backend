import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function createIssuesTable() {
  try {
    console.log('Creating key_issues table...');
    
    const sql = fs.readFileSync(path.join(__dirname, 'create-issues-table.sql'), 'utf8');
    
    await pool.query(sql);
    
    console.log('✓ key_issues table created successfully!');
    
    // Verify table was created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'key_issues'
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ Table verified in database');
    } else {
      console.log('✗ Table not found after creation');
    }
    
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createIssuesTable();
