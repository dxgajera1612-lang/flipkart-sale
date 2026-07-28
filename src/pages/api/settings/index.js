import connectToDatabase from '../../../utils/mongodb';
import Settings from '../../../models/Settings';
import { requireAdmin, verifyToken } from '../../../utils/auth';

connectToDatabase();

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') return handleGet(req, res);
    if (req.method === 'PUT') return requireAdmin(handlePut)(req, res);

    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

async function handleGet(req, res) {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({
      upi: {
        id: 'demo@upi',
        Gpay: true,
        Phonepe: true,
        Phonepe2: false,
        Phonepe2UpiId: '',
        Phonepe2Name: 'Flipkart Seller',
        Paytm: true,
        Bhim: true,
        WPay: false,
      },
      facebookPixel: { id: '', enabled: false },
      site: {
        name: 'Flipkart Store',
        currency: 'INR',
        currencySymbol: '₹',
      },
      shipping: {},
      payment: {
        codEnabled: true,
        onlinePaymentEnabled: true,
        cashfreeEnabled: false,
        cashfreeAppId: '',
        cashfreeSecretKey: '',
        cashfreeMode: 'sandbox',
      },
    });
  }

  // Securely handle sensitive payment credentials
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const isAdmin = token ? !!verifyToken(token) : false;

  // Merge environment variables dynamically
  const upiId = process.env.NEXT_PUBLIC_UPI_ID || settings.upi?.id || 'demo@upi';
  const phonepe2UpiId = process.env.NEXT_PUBLIC_PHONEPE2_UPI_ID || settings.upi?.Phonepe2UpiId || '';
  const phonepe2Name = process.env.NEXT_PUBLIC_PHONEPE2_NAME || settings.upi?.Phonepe2Name || 'Flipkart Seller';
  
  const upiData = {
    id: upiId,
    name: settings.upi?.name || '',
    Gpay: settings.upi ? !!settings.upi.Gpay : true,
    Phonepe: settings.upi ? !!settings.upi.Phonepe : true,
    Phonepe2: !!phonepe2UpiId || (settings.upi ? !!settings.upi.Phonepe2 : false),
    Phonepe2UpiId: phonepe2UpiId,
    Phonepe2Name: phonepe2Name,
    Paytm: settings.upi ? !!settings.upi.Paytm : true,
    Bhim: settings.upi ? !!settings.upi.Bhim : true,
    WPay: settings.upi ? !!settings.upi.WPay : false,
  };

  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || settings.facebookPixel?.id || '';
  const pixelEnabled = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ENABLED !== undefined 
    ? process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ENABLED === 'true' 
    : (settings.facebookPixel ? !!settings.facebookPixel.enabled : false);

  const facebookPixelData = {
    id: pixelId,
    enabled: pixelEnabled
  };

  const cashfreeAppId = process.env.CASHFREE_APP_ID || settings.payment?.cashfreeAppId || '';
  const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY || settings.payment?.cashfreeSecretKey || '';
  const cashfreeMode = process.env.CASHFREE_MODE || settings.payment?.cashfreeMode || 'sandbox';
  const cashfreeEnabled = process.env.CASHFREE_ENABLED !== undefined 
    ? process.env.CASHFREE_ENABLED === 'true' 
    : (settings.payment ? !!settings.payment.cashfreeEnabled : false);

  const paymentData = {
    codEnabled: settings.payment ? !!settings.payment.codEnabled : true,
    onlinePaymentEnabled: settings.payment ? !!settings.payment.onlinePaymentEnabled : true,
    cashfreeEnabled: cashfreeEnabled,
    cashfreeAppId: cashfreeAppId,
    cashfreeMode: cashfreeMode,
    cashfreeSecretKey: isAdmin
      ? cashfreeSecretKey
      : (cashfreeSecretKey
          ? `${cashfreeSecretKey.substring(0, 4)}****************${cashfreeSecretKey.slice(-4)}`
          : ''),
  };

  return res.status(200).json({
    success: true,
    data: {
      upi: upiData,
      facebookPixel: facebookPixelData,
      site: settings.site || {},
      shipping: settings.shipping || {},
      payment: paymentData,
    },
  });
}

async function handlePut(req, res) {
  const body = req.body || {};

  let settings = await Settings.findOne();

  if (!settings) {
    settings = new Settings({
      upi: {
        id: body?.upi?.id || 'demo@upi',
        Gpay: !!body?.upi?.Gpay,
        Phonepe: !!body?.upi?.Phonepe,
        Phonepe2: !!body?.upi?.Phonepe2,
        Phonepe2UpiId: body?.upi?.Phonepe2UpiId || '',
        Phonepe2Name: body?.upi?.Phonepe2Name || 'Flipkart Seller',
        Paytm: !!body?.upi?.Paytm,
        Bhim: !!body?.upi?.Bhim,
        WPay: !!body?.upi?.WPay,
      },
      facebookPixel: body.facebookPixel || {},
      site: body.site || {},
      shipping: body.shipping || {},
      payment: body.payment || {},
    });
  } else {

    // ✅ ensure subdocs exist
    settings.upi = settings.upi || {};
    settings.facebookPixel = settings.facebookPixel || {};
    settings.site = settings.site || {};
    settings.payment = settings.payment || {};

    // ✅ UPI update safe
    if (body.upi) {
      settings.upi.id = body.upi.id || settings.upi.id || 'demo@upi';
      settings.upi.Gpay = !!body.upi.Gpay;
      settings.upi.Phonepe = !!body.upi.Phonepe;
      settings.upi.Phonepe2 = !!body.upi.Phonepe2;
      settings.upi.Phonepe2UpiId = body.upi.Phonepe2UpiId ?? settings.upi.Phonepe2UpiId ?? '';
      settings.upi.Phonepe2Name = body.upi.Phonepe2Name ?? settings.upi.Phonepe2Name ?? 'Flipkart Seller';
      settings.upi.Paytm = !!body.upi.Paytm;
      settings.upi.Bhim = !!body.upi.Bhim;
      settings.upi.WPay = !!body.upi.WPay;
    }

    // ✅ other fields
    if (body.facebookPixel) {
      settings.facebookPixel.id = body.facebookPixel.id ?? settings.facebookPixel.id;
      settings.facebookPixel.enabled = !!body.facebookPixel.enabled;
    }

    if (body.site) {
      settings.site = { ...settings.site, ...body.site };
    }

    if (body.shipping) {
      settings.shipping = body.shipping;
    }

    if (body.payment) {
      settings.payment.codEnabled = body.payment.codEnabled ?? settings.payment.codEnabled;
      settings.payment.onlinePaymentEnabled = body.payment.onlinePaymentEnabled ?? settings.payment.onlinePaymentEnabled;
      settings.payment.cashfreeEnabled = body.payment.cashfreeEnabled ?? settings.payment.cashfreeEnabled;
      settings.payment.cashfreeAppId = body.payment.cashfreeAppId ?? settings.payment.cashfreeAppId;
      settings.payment.cashfreeMode = body.payment.cashfreeMode ?? settings.payment.cashfreeMode;
      
      // Update secret key if it's modified and not the masked dummy value
      if (body.payment.cashfreeSecretKey && !body.payment.cashfreeSecretKey.includes('*')) {
        settings.payment.cashfreeSecretKey = body.payment.cashfreeSecretKey;
      }
    }
  }

  await settings.save();

  return res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: settings,
  });
}
