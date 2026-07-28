// pages/api/payment/cashfree.js
// Server-side endpoint that creates a Cashfree payment session and returns a payment_session_id.
// The browser never sees the secret key — it only receives the session ID.

import connectToDatabase from '../../../utils/mongodb';
import Settings from '../../../models/Settings';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    // Load settings from DB
    const settings = await Settings.findOne();
    
    // Prioritize environment variables, fallback to DB settings
    const cashfreeAppId = process.env.CASHFREE_APP_ID || settings?.payment?.cashfreeAppId;
    const cashfreeSecretKey = process.env.CASHFREE_SECRET_KEY || settings?.payment?.cashfreeSecretKey;
    const cashfreeMode = process.env.CASHFREE_MODE || settings?.payment?.cashfreeMode || 'sandbox';
    const cashfreeEnabled = process.env.CASHFREE_ENABLED !== undefined
      ? process.env.CASHFREE_ENABLED === 'true'
      : !!settings?.payment?.cashfreeEnabled;

    if (!cashfreeEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Cashfree payment gateway is not enabled. Please enable it in admin settings or environment variables.',
      });
    }

    if (!cashfreeAppId || !cashfreeSecretKey) {
      return res.status(400).json({
        success: false,
        message: 'Cashfree App ID or Secret Key is missing. Please configure them in admin settings or environment variables.',
      });
    }

    // 1. Identical key validation
    if (cashfreeAppId === cashfreeSecretKey) {
      return res.status(400).json({
        success: false,
        message: 'Cashfree App ID and Secret Key cannot be identical. Please check your settings.',
      });
    }

    // 2. Masked key validation
    if (cashfreeSecretKey.includes('*')) {
      return res.status(400).json({
        success: false,
        message: 'Cashfree Secret Key appears to be masked (contains *). Please re-enter and save it in the Admin settings.',
      });
    }

    // 3. Mismatched environment mode validation
    const isSandboxKey = cashfreeAppId.toUpperCase().startsWith('TEST');
    if (cashfreeMode === 'sandbox' && !isSandboxKey) {
      return res.status(400).json({
        success: false,
        message: 'Gateway mode is Sandbox, but a Production App ID was provided (Sandbox App IDs must start with "TEST"). Please update your settings.',
      });
    } else if (cashfreeMode === 'production' && isSandboxKey) {
      return res.status(400).json({
        success: false,
        message: 'Gateway mode is Production, but a Sandbox App ID was provided (Sandbox App IDs start with "TEST"). Please update your settings.',
      });
    }

    // Validate request body
    const { amount, name, phone, email, orderId } = req.body || {};
    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: 'Amount and Order ID are required.' });
    }

    // Sanitize phone: Cashfree requires exactly 10-digit Indian mobile number
    const cleaned = (phone || '').toString().replace(/\D/g, '');
    const customerPhone = cleaned.length >= 10
      ? cleaned.slice(-10)
      : '9999999999';

    // Build return URL (where Cashfree redirects after payment)
    const origin =
      req.headers['x-forwarded-host']
        ? `https://${req.headers['x-forwarded-host']}`
        : req.headers.origin || `http://${req.headers.host || 'localhost:3000'}`;
    const returnUrl = `${origin}/ordersummdary?order_id={order_id}`;

    const baseUrl =
      cashfreeMode === 'production'
        ? 'https://api.cashfree.com/pg/orders'
        : 'https://sandbox.cashfree.com/pg/orders';

    const payload = {
      order_amount: Number(amount),
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: `cust_${Date.now()}`,
        customer_phone: customerPhone,
        customer_name: (name || 'ravi').slice(0, 50),
        customer_email: email || 'abbf@gmail.com',
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${origin}/api/payment/cashfree-webhook`,
      },
    };

    const cfRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': cashfreeAppId,
        'x-client-secret': cashfreeSecretKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const cfData = await cfRes.json();

    if (!cfRes.ok) {
      console.error('[Cashfree] API error:', cfData);
      return res.status(cfRes.status).json({
        success: false,
        message: cfData.message || `Cashfree API returned status ${cfRes.status}`,
        details: cfData,
      });
    }

    if (!cfData.payment_session_id) {
      console.error('[Cashfree] Missing payment_session_id in response:', cfData);
      return res.status(500).json({
        success: false,
        message: 'Cashfree did not return a payment session ID.',
      });
    }

    return res.status(200).json({
      success: true,
      payment_session_id: cfData.payment_session_id,
      order_id: cfData.order_id,
      order_status: cfData.order_status,
    });
  } catch (error) {
    console.error('[Cashfree] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating Cashfree session.',
      error: error.message,
    });
  }
}
