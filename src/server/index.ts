import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.development' });

const app = express();
const port = 3001;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

app.use(cors());
app.use(express.json());

// Add this helper function to verify Twitch token
async function verifyTwitchToken(token: string) {
  try {
    const response = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers: {
        'Authorization': `OAuth ${token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      return data.user_id;
    }
    return null;
  } catch (error) {
    console.error('Error validating Twitch token:', error);
    return null;
  }
}

// Middleware to check authentication
const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const userId = await verifyTwitchToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.userId = userId; // TypeScript might complain about this, we'll fix it
  next();
};

// Get messages
app.get('/api/messages', authMiddleware, async (req, res) => {
  try {
    const query = `
      SELECT 
        m.*,
        fu.display_name as from_user_name,
        fu.profile_image_url as from_user_image,
        tu.display_name as to_user_name,
        tu.profile_image_url as to_user_image,
        r.title as request_title
      FROM messages m
      JOIN users fu ON m.from_user_id = fu.id
      JOIN users tu ON m.to_user_id = tu.id
      JOIN requests r ON m.request_id = r.id
      WHERE m.from_user_id = $1 OR m.to_user_id = $1
      ORDER BY m.created_at DESC
    `;

    const { rows } = await pool.query(query, [req.userId]);
    
    const messages = rows.map(row => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      read: row.read,
      requestId: row.request_id,
      requestTitle: row.request_title,
      fromUser: {
        id: row.from_user_id,
        displayName: row.from_user_name,
        profileImageUrl: row.from_user_image
      },
      toUser: {
        id: row.to_user_id,
        displayName: row.to_user_name,
        profileImageUrl: row.to_user_image
      }
    }));

    res.json(messages);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Send message
app.post('/api/messages', async (req, res) => {
  try {
    const { content, toUserId, requestId, fromUserId } = req.body;

    const query = `
      INSERT INTO messages (id, content, from_user_id, to_user_id, request_id)
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [content, fromUserId, toUserId, requestId]);

    // Fetch the complete message with user details
    const messageQuery = `
      SELECT 
        m.*,
        fu.display_name as from_user_name,
        fu.profile_image_url as from_user_image,
        tu.display_name as to_user_name,
        tu.profile_image_url as to_user_image,
        r.title as request_title
      FROM messages m
      JOIN users fu ON m.from_user_id = fu.id
      JOIN users tu ON m.to_user_id = tu.id
      JOIN requests r ON m.request_id = r.id
      WHERE m.id = $1
    `;

    const { rows: messageRows } = await pool.query(messageQuery, [rows[0].id]);
    
    const message = {
      id: messageRows[0].id,
      content: messageRows[0].content,
      createdAt: messageRows[0].created_at,
      read: messageRows[0].read,
      requestId: messageRows[0].request_id,
      requestTitle: messageRows[0].request_title,
      fromUser: {
        id: messageRows[0].from_user_id,
        displayName: messageRows[0].from_user_name,
        profileImageUrl: messageRows[0].from_user_image
      },
      toUser: {
        id: messageRows[0].to_user_id,
        displayName: messageRows[0].to_user_name,
        profileImageUrl: messageRows[0].to_user_image
      }
    };

    res.json(message);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add this endpoint to your existing server file
app.get('/api/current-user', async (req, res) => {
  try {
    // Replace this with your actual authentication logic
    const userId = req.headers['x-user-id']; // You might get this from a session or token
    
    const query = `
      SELECT id, display_name, profile_image_url
      FROM users
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [userId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = {
      id: rows[0].id,
      displayName: rows[0].display_name,
      profileImageUrl: rows[0].profile_image_url
    };

    res.json(user);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/callback', async (req, res) => {
  const { code } = req.body;

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID!,
        client_secret: process.env.TWITCH_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITCH_REDIRECT_URI!,
      }),
    });

    const tokenData = await tokenResponse.json();

    // Get user data from Twitch
    const userResponse = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!,
      },
    });

    const userData = await userResponse.json();
    const twitchUser = userData.data[0];

    // Save or update user in your existing users table
    const query = `
      INSERT INTO users (id, login, display_name, profile_image_url, is_live, category, title)
      VALUES ($1, $2, $3, $4, false, NULL, NULL)
      ON CONFLICT (id) DO UPDATE SET
        login = EXCLUDED.login,
        display_name = EXCLUDED.display_name,
        profile_image_url = EXCLUDED.profile_image_url
      RETURNING id, display_name, profile_image_url;
    `;

    const { rows } = await pool.query(query, [
      twitchUser.id,
      twitchUser.login,
      twitchUser.display_name,
      twitchUser.profile_image_url,
    ]);

    // Return user data and token
    res.json({
      id: rows[0].id,
      displayName: rows[0].display_name,
      profileImageUrl: rows[0].profile_image_url,
      accessToken: tokenData.access_token,
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

app.get('/api/auth/validate', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Validate token with Twitch
    const validateResponse = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers: {
        'Authorization': `OAuth ${token}`,
      },
    });

    if (!validateResponse.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const twitchData = await validateResponse.json();

    // Get user from database
    const { rows } = await pool.query(
      'SELECT id, display_name, profile_image_url FROM users WHERE id = $1',
      [twitchData.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: rows[0].id,
      displayName: rows[0].display_name,
      profileImageUrl: rows[0].profile_image_url,
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 