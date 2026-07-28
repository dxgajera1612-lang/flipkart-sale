import { withAdminAuth } from '../../../middleware/auth';
import { getPaytmDb } from '../../../utils/paytmDb';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  return withAdminAuth(async (req, res) => {
    try {
      const db = await getPaytmDb();
      const collection = db.collection('transactions');

      const transactions = await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .toArray();

      const successTx = transactions.filter((t) => String(t.status || '').toUpperCase() === 'SUCCESS');
      const totalSuccessAmount = successTx.reduce((sum, tx) => {
        const amount = parseFloat(tx.amount || tx.totalAmount || tx.value || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

      return res.status(200).json({
        success: true,
        stats: {
          totalTransactions: transactions.length,
          successCount: successTx.length,
          totalSuccessAmount,
        },
        transactions,
      });
    } catch (error) {
      console.error('Admin Paytm transactions error:', error);

      const message = error?.message || 'Unable to fetch Paytm transactions';
      return res.status(500).json({
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      });
    }
  })(req, res);
}

export default handler;
