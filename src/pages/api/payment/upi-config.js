// pages/api/payment/upi-config.js
import connectToDatabase from '../../../utils/mongodb';
import Settings from '../../../models/Settings';
import { withAdminAuth } from '../../../middleware/auth';

/**
 * UPI Payment Configuration Management
 * Handles all UPI payment methods: Google Pay, PhonePe, PayTM, UPI, etc.
 */
async function handler(req, res) {
  try {
    await connectToDatabase();

    if (req.method === 'GET') {
      const settings = await Settings.findOne({}).lean();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Settings not found',
        });
      }

      const upiConfig = {
        primaryUPI: settings.upiId || '',
        methods: {
          gpay: {
            enabled: !!settings.upiId,
            upiId: settings.upiId || '',
            name: 'Google Pay',
            icon: 'gpay_icon.svg',
          },
          phonpe: {
            enabled: !!settings.upiId,
            upiId: settings.upiId || '',
            name: 'PhonePe',
            icon: 'phonepe.svg',
          },
          paytm: {
            enabled: !!settings.paytmUpiId,
            upiId: settings.paytmUpiId || '',
            name: 'PayTM',
            icon: 'paytm_icon.svg',
          },
          upi: {
            enabled: !!settings.upiId,
            upiId: settings.upiId || '',
            name: 'BHIM/Any UPI',
            icon: 'upi.svg',
          },
        },
        cashfree: {
          enabled: !!settings.cashfreeAppId,
          appId: settings.cashfreeAppId ? settings.cashfreeAppId.substring(0, 8) + '...' : '',
          mode: settings.cashfreeMode || 'production',
        },
      };

      return res.status(200).json({
        success: true,
        data: upiConfig,
      });
    }

    if (req.method === 'PUT') {
      const { primaryUPI, paytmUpiId, cashfreeAppId, cashfreeMode } = req.body;

      // Validate UPI IDs format
      const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/;

      if (primaryUPI && !upiRegex.test(primaryUPI)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid primary UPI ID format (must be like: user@bankname)',
        });
      }

      if (paytmUpiId && !upiRegex.test(paytmUpiId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid PayTM UPI ID format',
        });
      }

      const updatedSettings = await Settings.findOneAndUpdate(
        {},
        {
          upiId: primaryUPI,
          paytmUpiId: paytmUpiId,
          cashfreeAppId: cashfreeAppId,
          cashfreeMode: cashfreeMode || 'production',
          updatedAt: new Date(),
        },
        { new: true, upsert: true }
      ).select('-cashfreeSecretKey'); // Don't return secret key

      return res.status(200).json({
        success: true,
        message: 'UPI configuration updated successfully',
        data: updatedSettings,
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  } catch (error) {
    console.error('UPI config error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to manage UPI configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

export default withAdminAuth(handler);
