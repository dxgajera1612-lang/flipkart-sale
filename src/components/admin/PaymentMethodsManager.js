// components/admin/PaymentMethodsManager.js
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiSave, FiRefreshCw, FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

/**
 * Payment Methods Manager Component
 * Manages UPI, Cashfree, PhonePe, and other payment configurations
 */
export default function PaymentMethodsManager() {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  const [config, setConfig] = useState({
    primaryUPI: '',
    phonepeUpiId: '',
    paytmUpiId: '',
    cashfreeAppId: '',
    cashfreeMode: 'production',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payment/upi-config', {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.success) {
        setConfig({
          primaryUPI: data.data.primaryUPI || '',
          phonepeUpiId: data.data.methods.phonpe.upiId || '',
          paytmUpiId: data.data.methods.paytm.upiId || '',
          cashfreeAppId: data.data.cashfree.appId || '',
          cashfreeMode: data.data.cashfree.mode || 'production',
        });
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load payment configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/payment/upi-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Payment configuration updated successfully');
      } else {
        toast.error(data.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save payment configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
        <p className="mt-2 text-gray-600">Configure UPI, Cashfree, and other payment gateways</p>
      </div>

      {/* UPI Methods */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">UPI Payment Methods</h2>
        <div className="space-y-4">
          {/* Primary UPI */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Primary UPI ID (Google Pay, BHIM, Any UPI)
            </label>
            <input
              type="text"
              value={config.primaryUPI}
              onChange={(e) => setConfig({ ...config, primaryUPI: e.target.value })}
              placeholder="example@okhdfcbank"
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500">Format: username@bankname (e.g., merchant@ibl)</p>
          </div>

          {/* PhonePe UPI */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              PhonePe UPI ID
            </label>
            <input
              type="text"
              value={config.phonepeUpiId}
              onChange={(e) => setConfig({ ...config, phonepeUpiId: e.target.value })}
              placeholder="example@phonepe"
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500">Dedicated UPI for PhonePe transactions</p>
          </div>

          {/* PayTM UPI */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              PayTM UPI ID
            </label>
            <input
              type="text"
              value={config.paytmUpiId}
              onChange={(e) => setConfig({ ...config, paytmUpiId: e.target.value })}
              placeholder="example@paytm"
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500">Dedicated UPI for PayTM transactions</p>
          </div>
        </div>
      </div>

      {/* Cashfree Configuration */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Cashfree Gateway</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Cashfree App ID
            </label>
            <input
              type="text"
              value={config.cashfreeAppId}
              onChange={(e) => setConfig({ ...config, cashfreeAppId: e.target.value })}
              placeholder="Your Cashfree App ID"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Environment
            </label>
            <select
              value={config.cashfreeMode}
              onChange={(e) => setConfig({ ...config, cashfreeMode: e.target.value })}
              className="input"
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="production">Production (Live)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {config.cashfreeMode === 'sandbox'
                ? '🧪 Using sandbox credentials for testing'
                : '🔴 Using production credentials - be careful!'}
            </p>
          </div>
        </div>
      </div>

      {/* Status Display */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">Payment Methods Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            {config.primaryUPI ? (
              <>
                <FiCheck className="text-green-600" />
                <span className="text-green-700">Google Pay / UPI enabled</span>
              </>
            ) : (
              <>
                <FiX className="text-gray-400" />
                <span className="text-gray-500">Google Pay / UPI disabled</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {config.phonepeUpiId ? (
              <>
                <FiCheck className="text-green-600" />
                <span className="text-green-700">PhonePe enabled</span>
              </>
            ) : (
              <>
                <FiX className="text-gray-400" />
                <span className="text-gray-500">PhonePe disabled</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {config.paytmUpiId ? (
              <>
                <FiCheck className="text-green-600" />
                <span className="text-green-700">PayTM enabled</span>
              </>
            ) : (
              <>
                <FiX className="text-gray-400" />
                <span className="text-gray-500">PayTM disabled</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {config.cashfreeAppId ? (
              <>
                <FiCheck className="text-green-600" />
                <span className="text-green-700">Cashfree {config.cashfreeMode}</span>
              </>
            ) : (
              <>
                <FiX className="text-gray-400" />
                <span className="text-gray-500">Cashfree disabled</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiSave size={18} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>

        <button
          onClick={loadConfig}
          disabled={loading}
          className="btn btn-secondary flex items-center gap-2"
        >
          <FiRefreshCw size={18} />
          Reload
        </button>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
        <p className="text-sm text-yellow-800">
          <strong>⚠️ Important:</strong> Ensure all UPI IDs are correctly formatted and active. Incorrect configurations will cause payment failures.
        </p>
      </div>
    </div>
  );
}
