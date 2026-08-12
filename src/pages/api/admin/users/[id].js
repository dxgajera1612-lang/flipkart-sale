import connectToDatabase from '../../../../utils/mongodb';
import User from '../../../../models/User';
import { requireAdmin } from '../../../../utils/auth';

export default async function handler(req, res) {
  return requireAdmin(async (req, res) => {
    await connectToDatabase();
    const { id } = req.query;

    if (req.method === 'PUT') {
      const { name, phone, role, isActive } = req.body;
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (role) user.role = role;
      if (isActive !== undefined) user.isActive = isActive;

      await user.save();
      const updatedUser = user.toObject();
      delete updatedUser.password;

      return res.status(200).json({ success: true, user: updatedUser });
    }

    if (req.method === 'DELETE') {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      await user.deleteOne();
      return res.status(200).json({ success: true, message: 'User deleted successfully' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  })(req, res);
}
