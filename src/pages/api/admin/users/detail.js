// pages/api/admin/users/detail.js
import connectToDatabase from '../../../../utils/mongodb';
import User from '../../../../models/User';
import { withAdminAuth } from '../../../../middleware/auth';

async function handler(req, res) {
  try {
    await connectToDatabase();

    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    if (req.method === 'GET') {
      const user = await User.findOne({ email: email.toLowerCase() }, '-password').lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: user,
      });
    }

    if (req.method === 'PUT') {
      const { name, phone, role, isActive } = req.body;

      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        {
          name: name || undefined,
          phone: phone || undefined,
          role: role || undefined,
          isActive: isActive !== undefined ? isActive : undefined,
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    }

    if (req.method === 'DELETE') {
      const user = await User.findOneAndDelete({ email: email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  } catch (error) {
    console.error('User detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to process user request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

export default withAdminAuth(handler);
