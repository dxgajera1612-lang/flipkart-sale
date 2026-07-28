// pages/api/admin/users.js
import connectToDatabase from '../../../utils/mongodb';
import User from '../../../models/User';
import { withAdminAuth } from '../../../middleware/auth';

async function handler(req, res) {
  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const users = await User.find({}, '-password').sort({ createdAt: -1 }).lean();
      return res.status(200).json({ 
        success: true, 
        users: users,
        count: users.length 
      });
    }

    if (req.method === 'POST') {
      const { name, email, password, phone, role, isActive } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name, email, and password are required.' 
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ 
          success: false, 
          message: 'Password must be at least 8 characters long' 
        });
      }

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ 
          success: false, 
          message: 'A user with this email already exists.' 
        });
      }

      const user = new User({
        name,
        email: email.toLowerCase(),
        password,
        phone: phone || '',
        role: role || 'user',
        isActive: isActive !== false,
      });

      await user.save();
      const createdUser = user.toObject();
      delete createdUser.password;

      return res.status(201).json({ 
        success: true, 
        message: 'User created successfully',
        user: createdUser 
      });
    }

    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to manage users', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

export default withAdminAuth(handler);
