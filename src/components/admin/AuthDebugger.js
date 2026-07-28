// components/admin/AuthDebugger.js
import { useState, useEffect } from 'react';
import { FiRefreshCw, FiCheck, FiX, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
import { decodeToken, verifyToken } from '../../utils/auth';
import toast from 'react-hot-toast';

/**
 * Authorization Diagnostic Component
 * Shows:
 * - Token validity and expiration
 * - User role and permissions
 * - API connectivity
 * - Token refresh capability
 */
export default function AuthDebugger() {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [apiTests, setApiTests] = useState({});
  const [loading, setLoading] = useState(true);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    analyzeAuth();
  }, []);

  const analyzeAuth = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      const decoded = decodeToken(token);
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      setTokenInfo({
        hasToken: !!token,
        token: token?.substring(0, 20) + '...',
        fullToken: token,
        decoded,
        user,
        expiresAt: decoded?.exp
          ? new Date(decoded.exp * 1000).toLocaleString()
          : 'Unknown',
        isExpired: decoded?.exp ? decoded.exp * 1000 < Date.now() : false,
      });

      // Test API endpoints
      await testApiConnectivity(token);
    } catch (error) {
      console.error('Auth analysis error:', error);
      toast.error('Failed to analyze authentication');
    } finally {
      setLoading(false);
    }
  };

  const testApiConnectivity = async (token) => {
    const tests = {
      products: false,
      users: false,
      paytm: false,
    };

    try {
      // Test products endpoint
      const productsRes = await fetch('/api/products?limit=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      tests.products = productsRes.ok;

      // Test users endpoint
      const usersRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      tests.users = usersRes.ok;

      // Test paytm endpoint
      const paytmRes = await fetch('/api/admin/paytm-transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      tests.paytm = paytmRes.ok;
    } catch (error) {
      console.error('API test error:', error);
    }

    setApiTests(tests);
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-40 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!tokenInfo?.hasToken) {
    return (
      <div className="card bg-red-50 border-l-4 border-red-500">
        <div className="flex items-start gap-3">
          <FiX className="text-red-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-red-900">No Authentication Token</h4>
            <p className="text-sm text-red-700 mt-1">
              Please log in first to view authentication details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status, label }) => (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100">
      {status ? (
        <>
          <FiCheck className="text-green-600" size={16} />
          <span className="text-green-700">{label} OK</span>
        </>
      ) : (
        <>
          <FiX className="text-red-600" size={16} />
          <span className="text-red-700">{label} Failed</span>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Token Information */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Token Information</h3>
          <button
            onClick={analyzeAuth}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Token Display */}
          <div>
            <label className="text-sm font-medium text-gray-600">JWT Token</label>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-gray-100 p-2 rounded font-mono text-xs text-gray-700 truncate">
                {showToken ? tokenInfo.fullToken : tokenInfo.token}
              </div>
              <button
                onClick={() => setShowToken(!showToken)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showToken ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tokenInfo.fullToken);
                  toast.success('Token copied');
                }}
                className="text-gray-500 hover:text-primary-600"
              >
                <FiCopy size={18} />
              </button>
            </div>
          </div>

          {/* Expiration Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Expires At</label>
              <p className="mt-1 text-sm text-gray-900">{tokenInfo.expiresAt}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <div className="mt-1">
                {tokenInfo.isExpired ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                    <FiX size={14} /> Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    <FiCheck size={14} /> Valid
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Token Payload */}
          <div>
            <label className="text-sm font-medium text-gray-600">Decoded Payload</label>
            <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-200">
              <pre className="text-xs text-gray-700 overflow-auto max-h-40">
                {JSON.stringify(tokenInfo.decoded, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* User Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            <p className="mt-1 text-gray-900">{tokenInfo.user?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <p className="mt-1 text-gray-900">{tokenInfo.user?.email || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Role</label>
            <p className="mt-1">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                  tokenInfo.user?.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {tokenInfo.user?.role?.toUpperCase() || 'USER'}
              </span>
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">ID</label>
            <p className="mt-1 text-xs text-gray-600 font-mono">
              {tokenInfo.user?.id?.substring(0, 16)}...
            </p>
          </div>
        </div>
      </div>

      {/* API Connectivity Tests */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Connectivity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm font-medium text-gray-700">Products API</span>
            <StatusBadge status={apiTests.products} label="Products" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm font-medium text-gray-700">Users API</span>
            <StatusBadge status={apiTests.users} label="Users" />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <span className="text-sm font-medium text-gray-700">Paytm Transactions API</span>
            <StatusBadge status={apiTests.paytm} label="Paytm" />
          </div>
        </div>
      </div>

      {/* Authorization Summary */}
      <div className={`card border-l-4 ${tokenInfo.isExpired ? 'bg-red-50 border-red-500' : 'bg-green-50 border-green-500'}`}>
        <div className="flex items-start gap-3">
          {tokenInfo.isExpired ? (
            <FiX className="text-red-600 flex-shrink-0 mt-1" size={20} />
          ) : (
            <FiCheck className="text-green-600 flex-shrink-0 mt-1" size={20} />
          )}
          <div>
            <h4 className={`font-semibold ${tokenInfo.isExpired ? 'text-red-900' : 'text-green-900'}`}>
              {tokenInfo.isExpired ? 'Authentication Expired' : 'Authorization Active'}
            </h4>
            <p className={`text-sm mt-1 ${tokenInfo.isExpired ? 'text-red-700' : 'text-green-700'}`}>
              {tokenInfo.isExpired
                ? 'Your session has expired. Please log in again.'
                : `${tokenInfo.user?.role?.toUpperCase() || 'USER'} privileges active. Token will expire on ${tokenInfo.expiresAt}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
