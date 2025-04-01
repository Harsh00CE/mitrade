import { verifyToken } from './authUtils.js';
import UserModel from '../schemas/userSchema.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookies
    let token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Check if user still exists
    const currentUser = await UserModel.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ 
        success: false,
        message: 'User no longer exists' 
      });
    }

    // Add user to request
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token' 
    });
  }
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'You do not have permission to perform this action' 
      });
    }
    next();
  };
};