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

async function updateIssuesTable() {
  try {
    console.log('Checking if content column exists...');
    
    // Check if the table exists and has content column
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'key_issues' AND column_name = 'content'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('Renaming content column to issue_text...');
      await pool.query('ALTER TABLE key_issues RENAME COLUMN content TO issue_text');
      console.log('✓ Column renamed successfully!');
    } else {
      console.log('✓ Column already named issue_text or table does not exist');
    }
    
  } catch (error) {
    console.error('Error updating table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

updateIssuesTable();
