import connectToDatabase from '../../../../utils/mongodb';
import User from '../../../../models/User';
import { requireAdmin } from '../../../../utils/auth';

export default async function handler(req, res) {
  return requireAdmin(async (req, res) => {
    await connectToDatabase();

    if (req.method !== 'PUT') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
      const { userId, newPassword } = req.body;
      if (!userId || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Valid user ID and password are required.' });
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      user.password = newPassword;
      await user.save();

      return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ success: false, message: 'Unable to change password', error: error.message });
    }
  })(req, res);
}
