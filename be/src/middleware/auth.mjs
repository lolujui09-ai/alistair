import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt.mjs';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No token provided',
    });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      message: 'Invalid authorization format. Format should be: Bearer <token>',
    });
  }

  const token = parts[1].trim();

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (error) {
    console.warn(`[authMiddleware] Token verification failed: ${error.message}`);
    res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid or expired token',
    });
  }
}
