import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.mjs';
import { getJwtSecret, JWT_EXPIRES_IN } from '../config/jwt.mjs';

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const errors = [];

    if (!name || name.trim() === '') {
      errors.push('Name is required');
    }
    if (!email || email.trim() === '') {
      errors.push('Email is required');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Invalid email format');
      }
    }
    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
    }

    const [existing] = await pool.query(
      'SELECT id, email FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    const [newUserRows] = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = newUserRows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to register user',
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const [rows] = await pool.query(
      'SELECT id, name, email, password FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const userRecord = rows[0];

    const isMatch = await bcrypt.compare(password, userRecord.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to login',
    });
  }
}

export async function logout(req, res) {
  res.json({
    success: true,
    message: 'Logout successful',
  });
}

export async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('Get profile error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
    });
  }
}
