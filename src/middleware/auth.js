// middleware/auth.js
import { verifyToken } from '../utils/auth';

/**
 * Middleware to verify JWT token from Authorization header
 */
export const withAuth = (handler) => {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No token provided.',
        });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token.',
        });
      }

      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication error.',
      });
    }
  };
};

/**
 * Middleware to verify admin role
 */
export const withAdminAuth = (handler) => {
  return async (req, res) => {
    try {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No token provided.',
        });
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired token.',
        });
      }

      // Check admin role
      if (decoded.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.',
        });
      }

      req.user = decoded;
      return handler(req, res);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authentication error.',
      });
    }
  };
};
