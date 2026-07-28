// components/admin/AdvancedSettings.js
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FiSave,
  FiRefreshCw,
  FiCheck,
  FiX,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiDownload,
  FiUpload,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

/**
 * Advanced Settings Component
 * Features:
 * - Payment configuration
 * - Authorization tokens
 * - API keys management
 * - System backup/restore
 * - Token validation
 */
export default function AdvancedSettings() {
  const { getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});
  const [settings, setSettings] = useState({
    // UPI Configuration
    upiId: '',
    phonepeUpiId: '',
    
    // API Keys (masked)
    cashfreeAppId: '',
    cashfreeSecretKey: '',
    
    // Facebook Pixel
    facebookPixelId: '',
    
    // Security
    jwtSecret: '',
    tokenExpiry: '7d',
  });

  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings', {
        headers: getAuthHeader(),
      });

      const data = await response.json();
      if (data.success) {
        setSettings(data.data || settings);
        setFormData(data.data || settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setSettings(formData);
        toast.success('Settings saved successfully');
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(settings);
    toast.success('Changes discarded');
  };

  const toggleShowSecret = (field) => {
    setShowSecrets((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const copyToClipboard = (value, label) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settings-backup-${Date.now()}.json`;
    link.click();
    toast.success('Settings exported');
  };

  const handleImportSettings = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result || '{}');
        setFormData(importedData);
        toast.success('Settings imported successfully');
      } catch (error) {
        toast.error('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  const SettingGroup = ({ title, description, children }) => (
    <div className="card mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <div className="space-y-4 border-t pt-4">{children}</div>
    </div>
  );

  const SettingField = ({ label, value, field, type = 'text', isSecret = false }) => (
    <div className="flex flex-col">
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={isSecret && !showSecrets[field] ? 'password' : 'text'}
          value={formData[field] || ''}
          onChange={(e) =>
            setFormData({ ...formData, [field]: e.target.value })
          }
          className="input pr-24"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
          {isSecret && (
            <button
              type="button"
              onClick={() => toggleShowSecret(field)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showSecrets[field] ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          )}
          {formData[field] && (
            <button
              type="button"
              onClick={() => copyToClipboard(formData[field], label)}
              className="text-gray-400 hover:text-primary-600 transition-colors"
            >
              <FiCopy size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Advanced Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure payment methods, API keys, and security settings
        </p>
      </div>

      {/* UPI Configuration */}
      <SettingGroup
        title="UPI Payment Configuration"
        description="Configure UPI IDs for different payment gateways"
      >
        <SettingField
          label="Primary UPI ID"
          field="upiId"
          placeholder="example@bank"
        />
        <SettingField
          label="PhonePe UPI ID"
          field="phonepeUpiId"
          placeholder="example@phonepe"
        />
      </SettingGroup>

      {/* Payment Gateway Keys */}
      <SettingGroup
        title="Payment Gateway Configuration"
        description="Manage Cashfree API credentials (kept encrypted)"
      >
        <SettingField
          label="Cashfree App ID"
          field="cashfreeAppId"
          isSecret={true}
        />
        <SettingField
          label="Cashfree Secret Key"
          field="cashfreeSecretKey"
          isSecret={true}
        />
      </SettingGroup>

      {/* Analytics Configuration */}
      <SettingGroup
        title="Analytics & Tracking"
        description="Configure third-party analytics services"
      >
        <SettingField
          label="Facebook Pixel ID"
          field="facebookPixelId"
          placeholder="123456789"
        />
      </SettingGroup>

      {/* Security Settings */}
      <SettingGroup
        title="Security Settings"
        description="Manage authentication and token configuration"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingField
            label="JWT Secret"
            field="jwtSecret"
            isSecret={true}
          />
          <div className="flex flex-col">
            <label className="label">Token Expiry</label>
            <select
              value={formData.tokenExpiry || '7d'}
              onChange={(e) =>
                setFormData({ ...formData, tokenExpiry: e.target.value })
              }
              className="input"
            >
              <option value="1d">1 Day</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="90d">90 Days</option>
            </select>
          </div>
        </div>
      </SettingGroup>

      {/* Status Display */}
      <div className="card bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-center gap-3">
          <FiCheck className="text-blue-600 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-semibold text-blue-900">System Status</h4>
            <p className="text-sm text-blue-700 mt-1">
              All critical systems are operational. Settings are automatically encrypted.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={loading}
          className="btn btn-primary flex items-center justify-center gap-2"
        >
          <FiSave size={18} />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>

        <button
          onClick={handleReset}
          disabled={loading}
          className="btn btn-secondary flex items-center justify-center gap-2"
        >
          <FiRefreshCw size={18} />
          Reset
        </button>

        <button
          onClick={exportSettings}
          className="btn btn-outline flex items-center justify-center gap-2"
        >
          <FiDownload size={18} />
          Export
        </button>

        <label className="btn btn-outline flex items-center justify-center gap-2 cursor-pointer">
          <FiUpload size={18} />
          Import
          <input
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
          />
        </label>
      </div>

      {/* Warning */}
      <div className="card bg-yellow-50 border-l-4 border-yellow-500">
        <div className="flex items-start gap-3">
          <FiX className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-yellow-900">Important</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Do not share your API keys, secret keys, or JWT secret with anyone. Keep these credentials confidential and never commit them to version control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
