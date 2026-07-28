// pages/admin/index.js
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiShoppingCart,
  FiCreditCard,
} from 'react-icons/fi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalRevenue: 0,
    totalOrders: 0,
    loading: true,
  });
  const [paytmSummary, setPaytmSummary] = useState({
    totalTransactions: 0,
    successCount: 0,
    totalSuccessAmount: 0,
    loading: true,
  });

  useEffect(() => {
    fetchStats();
    fetchPaytmSummary();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/products?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        const products = data.data;
        setStats({
          totalProducts: products.length,
          activeProducts: products.filter(p => p.isActive).length,
          totalRevenue: products.reduce((sum, p) => sum + (p.sellingPrice * (p.soldCount || 0)), 0),
          totalOrders: products.reduce((sum, p) => sum + (p.soldCount || 0), 0),
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchPaytmSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/paytm-transactions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPaytmSummary({
          totalTransactions: data.stats.totalTransactions || 0,
          successCount: data.stats.successCount || 0,
          totalSuccessAmount: data.stats.totalSuccessAmount || 0,
          loading: false,
        });
      } else {
        setPaytmSummary((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error fetching Paytm summary:', error);
      setPaytmSummary((prev) => ({ ...prev, loading: false }));
    }
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: FiPackage,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Products',
      value: stats.activeProducts,
      icon: FiTrendingUp,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: FiShoppingCart,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Paytm Balance',
      value: paytmSummary.loading
        ? '...'
        : `₹${paytmSummary.totalSuccessAmount.toLocaleString()}`,
      icon: FiCreditCard,
      color: 'bg-teal-500',
      textColor: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="card card-hover animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stats.loading ? (
                        <span className="text-gray-400">...</span>
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`${stat.textColor}`} size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/products/new"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
            >
              <FiPackage
                className="mx-auto text-gray-400 group-hover:text-primary-600 transition-colors"
                size={32}
              />
              <h3 className="mt-2 font-medium text-gray-900 group-hover:text-primary-600">
                Add New Product
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a new product listing
              </p>
            </a>

            <a
              href="/admin/bulk-upload"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
            >
              <FiTrendingUp
                className="mx-auto text-gray-400 group-hover:text-primary-600 transition-colors"
                size={32}
              />
              <h3 className="mt-2 font-medium text-gray-900 group-hover:text-primary-600">
                Bulk Upload
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload products via CSV
              </p>
            </a>

            <a
              href="/admin/settings"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-center group"
            >
              <FiDollarSign
                className="mx-auto text-gray-400 group-hover:text-primary-600 transition-colors"
                size={32}
              />
              <h3 className="mt-2 font-medium text-gray-900 group-hover:text-primary-600">
                Settings
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Configure UPI & Pixel
              </p>
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
