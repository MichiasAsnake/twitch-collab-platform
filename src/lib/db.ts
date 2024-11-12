import { Pool } from 'pg';
import { sql } from '@vercel/postgres';

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export async function deleteRequest(requestId: string, userId: string) {
  try {
    // First verify ownership
    const result = await sql`
      SELECT user_id 
      FROM requests 
      WHERE id = ${requestId}
    `;

    if (result.rows.length === 0) {
      throw new Error('Request not found');
    }

    if (result.rows[0].user_id !== userId) {
      throw new Error('Unauthorized');
    }

    // Delete the request
    await sql`
      DELETE FROM requests 
      WHERE id = ${requestId} 
      AND user_id = ${userId}
    `;

    return true;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
} 