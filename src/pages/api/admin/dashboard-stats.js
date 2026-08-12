// pages/api/admin/dashboard-stats.js
import connectToDatabase from '../../../utils/mongodb';
import Product from '../../../models/Product';
import User from '../../../models/User';
import { getPaytmDb } from '../../../utils/paytmDb';
import { withAdminAuth } from '../../../middleware/auth';

/**
 * Comprehensive Dashboard Statistics Endpoint
 * Returns all stats needed for admin dashboard
 */
async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    await connectToDatabase();

    // Parallel data fetching
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      totalUsers,
      activeUsers,
      paytmDb,
    ] = await Promise.all([
      Product.countDocuments({}),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isFeatured: true }),
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      getPaytmDb().catch(() => null),
    ]);

    // Calculate revenue from products
    const products = await Product.find({}, { sellingPrice: 1, soldCount: 1 });
    const totalRevenue = products.reduce((sum, p) => {
      return sum + ((p.sellingPrice || 0) * (p.soldCount || 0));
    }, 0);

    const totalOrders = products.reduce((sum, p) => sum + (p.soldCount || 0), 0);

    // Fetch Paytm stats if available
    let paytmStats = {
      totalTransactions: 0,
      successCount: 0,
      failureCount: 0,
      totalSuccessAmount: 0,
      totalFailureAmount: 0,
    };

    if (paytmDb) {
      try {
        const collection = paytmDb.collection('transactions');
        const transactions = await collection.find({}).toArray();

        paytmStats = {
          totalTransactions: transactions.length,
          successCount: transactions.filter(t => String(t.status || '').toUpperCase() === 'SUCCESS').length,
          failureCount: transactions.filter(t => String(t.status || '').toUpperCase() === 'FAILURE').length,
          totalSuccessAmount: transactions
            .filter(t => String(t.status || '').toUpperCase() === 'SUCCESS')
            .reduce((sum, t) => sum + (parseFloat(t.amount || t.totalAmount || 0)), 0),
          totalFailureAmount: transactions
            .filter(t => String(t.status || '').toUpperCase() === 'FAILURE')
            .reduce((sum, t) => sum + (parseFloat(t.amount || t.totalAmount || 0)), 0),
        };
      } catch (err) {
        console.error('Paytm stats error:', err);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          featured: featuredProducts,
          inactive: totalProducts - activeProducts,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        revenue: {
          total: totalRevenue,
          orders: totalOrders,
          averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        },
        payments: paytmStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

export default withAdminAuth(handler);
