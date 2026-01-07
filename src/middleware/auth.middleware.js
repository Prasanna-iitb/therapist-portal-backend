import { verifyToken } from '../utils/jwt.js';

export const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  req.user = decoded;
  next();
};

// Special middleware for media endpoints that accept token as query parameter
export const authenticateTokenQuery = (req, res, next) => {
  const token = req.query.token || req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  req.user = decoded;
  next();
};
