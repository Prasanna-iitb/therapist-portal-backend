import express from 'express';
import bcrypt from 'bcryptjs';
import passport from '../config/passport.js';
import { generateToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import db from '../db/index.js';

const router = express.Router();

// Register new user with email/password
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new therapist for this user
    const newTherapist = await db.query(
      'INSERT INTO therapist (name, email, subscription_tier) VALUES ($1, $2, $3) RETURNING "Therapist_id"',
      [email.split('@')[0], email, 'free']
    );
    const customerId = newTherapist.rows[0].Therapist_id;

    // Create user
    const result = await db.query(
      'INSERT INTO users (email, password_hash, name, customer_id, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, name',
      [email, hashedPassword, email.split('@')[0], customerId, 'therapist']
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken({
      id: user.user_id,
      email: user.email,
      name: user.name,
    });

    res.json({ token, user: { id: user.user_id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      id: user.user_id,
      email: user.email,
      name: user.name,
    });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'none',
    });

    res.json({ token, user: { id: user.user_id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Initiate Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Check if user exists in database
      let result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [req.user.email]
      );

      let user;
      if (result.rows.length === 0) {
        // Create a new therapist for this Google user
        const newTherapist = await db.query(
          'INSERT INTO therapist (name, email, subscription_tier) VALUES ($1, $2, $3) RETURNING "Therapist_id"',
          [req.user.name, req.user.email, 'free']
        );
        const customerId = newTherapist.rows[0].Therapist_id;

        // Create new user
        result = await db.query(
          'INSERT INTO users (email, name, google_id, picture, customer_id, role, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id, email, name, picture',
          [req.user.email, req.user.name, req.user.googleId, req.user.picture, customerId, 'therapist', '']
        );
        user = result.rows[0];
      } else {
        user = result.rows[0];
        // Update google info if logging in via Google
        await db.query(
          'UPDATE users SET google_id = $1, picture = $2, name = $3 WHERE user_id = $4',
          [req.user.googleId, req.user.picture, req.user.name, user.user_id]
        );
      }

      // Generate JWT token
      const token = generateToken({
        id: user.user_id,
        email: user.email,
        name: user.name || req.user.name,
        picture: user.picture || req.user.picture,
      });

      // Set cookie with token
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });

      // Redirect to frontend with token
      res.redirect(`http://localhost:5173?token=${token}`);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect('http://localhost:5173/login?error=authentication_failed');
    }
  }
);

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
