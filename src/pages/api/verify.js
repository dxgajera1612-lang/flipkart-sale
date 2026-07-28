import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://v4x123:v4x123@cluster0.i3hnzcs.mongodb.net/www3";

let client = null;

async function getPaytmDb() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client.db('paytm_db');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { orderId, utrNo, remark, comment } = req.body || {};
    
    const queryKey = (remark || comment || utrNo || orderId || '').trim().toLowerCase();

    if (!queryKey) {
      return res.status(400).json({ verified: false, message: 'Please provide an Order ID or payment details to verify.' });
    }

    const db = await getPaytmDb();
    const collection = db.collection('transactions');

    // Fetch the last 100 transactions to search
    const transactions = await collection.find({}).sort({ createdAt: -1 }).limit(100).toArray();

    const match = transactions.find((t) => {
      const c = String(t.comment || '').toLowerCase();
      const o = String(t.orderId || '').toLowerCase();
      const u = String(t.utrNo || '').toLowerCase();
      const r = String(t.remark || '').toLowerCase();

      // Check if the query key matches comment, orderId, utrNo, or remark
      const isMatch = c.includes(queryKey) || o.includes(queryKey) || u.includes(queryKey) || r.includes(queryKey);
      const isSuccess = String(t.status || '').toUpperCase() === 'SUCCESS';

      return isMatch && isSuccess;
    });

    if (match) {
      return res.status(200).json({
        verified: true,
        matchType: 'COMMENT_REMARK_MATCH',
        transaction: match,
        message: `Payment verified successfully!`,
      });
    }

    return res.status(200).json({
      verified: false,
      message: `Payment not found yet. Please make sure the payment comment/note matches "${queryKey}" and is completed.`,
    });
  } catch (error) {
    console.error('Verify API Error:', error);
    return res.status(500).json({ verified: false, message: 'Internal Server Error', error: error.message });
  }
}
