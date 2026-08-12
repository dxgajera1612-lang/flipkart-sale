// utils/auth.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-secret-key';
const JWT_EXPIRES_IN = '7d';

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

export const authenticateUser = (handler) => {
  return async (req, res) => {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = token ? verifyToken(token) : null;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    req.user = user;
    return handler(req, res);
  };
};

export const requireAdmin = (handler) => {
  return async (req, res) => {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = token ? verifyToken(token) : null;

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    req.user = user;
    return handler(req, res);
  };
};
