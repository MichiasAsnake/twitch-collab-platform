import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const initDb = async () => {
  try {
    const sqlPath = path.join(__dirname, 'db', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
}; 