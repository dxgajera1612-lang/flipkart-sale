import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';

export default function PaytmTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    successCount: 0,
    failedCount: 0,
    totalSuccessAmount: 0,
    loading: true,
  });
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onlySuccess, setOnlySuccess] = useState(false);
  const [excludeAutoPaytmComment, setExcludeAutoPaytmComment] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/paytm-transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions || []);
        setStats({
          totalTransactions: data.stats.totalTransactions || 0,
          successCount: data.stats.successCount || 0,
          failedCount: (data.stats.totalTransactions || 0) - (data.stats.successCount || 0),
          totalSuccessAmount: data.stats.totalSuccessAmount || 0,
          loading: false,
        });
        setError(null);
      } else {
        setError(data.message || 'Unable to load transactions');
        setStats(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('Fetch Paytm transactions failed:', err);
      setError(err?.message || 'Unable to load transactions');
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const search = searchTerm.trim().toLowerCase();
    const orderId = String(tx.orderId || '').toLowerCase();
    const comment = String(tx.comment || tx.remark || '').toLowerCase();
    const utr = String(tx.utrNo || '').toLowerCase();
    const status = String(tx.status || '').toLowerCase();
    const isAutoPaytmComment = comment.includes('sent using paytm upi');

    const matchesSearch =
      !search ||
      orderId.includes(search) ||
      comment.includes(search) ||
      utr.includes(search);

    const matchesStatus =
      statusFilter === 'all' ||
      status === statusFilter;

    const matchesSuccess = !onlySuccess || status === 'success';
    const matchesAutoPaytm = !excludeAutoPaytmComment || !isAutoPaytmComment;

    return matchesSearch && matchesStatus && matchesSuccess && matchesAutoPaytm;
  });

  const displayStats = filteredTransactions.reduce(
    (acc, tx) => {
      const status = String(tx.status || '').toLowerCase();
      const amount = Number(tx.amount || tx.totalAmount || tx.value || 0) || 0;
      acc.totalTransactions += 1;
      if (status === 'success') {
        acc.successCount += 1;
        acc.totalSuccessAmount += amount;
      }
      return acc;
    },
    { totalTransactions: 0, successCount: 0, totalSuccessAmount: 0 }
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paytm Transactions</h1>
          <p className="mt-2 text-gray-600">
            View recent Paytm transaction ledger and balance summary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Total Transactions',
              value: stats.loading ? '...' : displayStats.totalTransactions,
            },
            {
              title: 'Successful Payments',
              value: stats.loading ? '...' : displayStats.successCount,
            },
            {
              title: 'Success Amount',
              value: stats.loading ? '...' : `₹${displayStats.totalSuccessAmount.toLocaleString()}`,
            },
          ].map((card) => (
            <div key={card.title} className="card p-5">
              <p className="text-sm font-medium text-gray-500">{card.title}</p>
              <p className="mt-3 text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <div>
              <label className="label">Search</label>
              <input
                type="text"
                className="input"
                placeholder="Search Order ID, Comment, UTR"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Status Filter</label>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="onlySuccess"
                type="checkbox"
                checked={onlySuccess}
                onChange={(e) => setOnlySuccess(e.target.checked)}
                className="h-4 w-4 text-primary-600 rounded border-gray-300"
              />
              <label htmlFor="onlySuccess" className="text-sm text-gray-700">
                Only Success
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="excludeAutoPaytmComment"
                type="checkbox"
                checked={excludeAutoPaytmComment}
                onChange={(e) => setExcludeAutoPaytmComment(e.target.checked)}
                className="h-4 w-4 text-primary-600 rounded border-gray-300"
              />
              <label htmlFor="excludeAutoPaytmComment" className="text-sm text-gray-700">
                Hide "Sent using Paytm UPI"
              </label>
            </div>
          </div>
        </div>

        {error ? (
          <div className="card p-5 text-red-600 bg-red-50">
            <div className="flex items-center justify-between gap-3">
              <div>{error}</div>
              <button
                onClick={fetchTransactions}
                className="btn btn-secondary"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <div className="px-4 py-5 sm:px-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Transaction Ledger</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Showing {filteredTransactions.length} of {transactions.length} records{excludeAutoPaytmComment ? ' (auto Paytm UPI comments hidden)' : ''}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="btn btn-secondary"
                >
                  Clear Search
                </button>
                <button
                  type="button"
                  onClick={fetchTransactions}
                  className="btn btn-primary"
                >
                  Refresh
                </button>
              </div>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Comment / Remark</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">UTR</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                      No transactions match the current filter.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const createdAt = tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A';
                    const amount = tx.amount || tx.totalAmount || tx.value || 'N/A';
                    const status = String(tx.status || '').toUpperCase();
                    return (
                      <tr key={tx._id || `${tx.orderId}-${tx.utrNo}-${tx.createdAt}`}>
                        <td className="px-4 py-3 text-sm text-gray-700">{tx.orderId || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">₹{amount}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            status === 'SUCCESS'
                              ? 'bg-green-100 text-green-800'
                              : status === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{tx.comment || tx.remark || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{tx.utrNo || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{createdAt}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
