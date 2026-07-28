// pages/admin/settings.js
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  FiCreditCard,
  FiGlobe,
  FiTrendingUp,
  FiSettings,
  FiSave,
} from 'react-icons/fi';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('upi');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    upi: {
      id: '',
      name: '',
      Gpay: true,
      Phonepe: true,
      Phonepe2: false,
      Phonepe2UpiId: '',
      Phonepe2Name: 'Flipkart Seller',
      Paytm: true,
      Bhim: true,
      WPay: false,
    },
    facebookPixel: {
      id: '',
      enabled: false,
    },
    googleAnalytics: {
      id: '',
      enabled: false,
    },
    site: {
      name: 'Flipkart Store',
      email: '',
      phone: '',
      currency: 'INR',
      currencySymbol: '₹',
    },
    payment: {
      codEnabled: true,
      onlinePaymentEnabled: true,
      cashfreeEnabled: false,
      cashfreeAppId: '',
      cashfreeSecretKey: '',
      cashfreeMode: 'sandbox',
    },
  });
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          ...data.data,
          payment: {
            ...prev.payment,
            ...(data.data.payment || {})
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (section) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ [section]: settings[section] }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert('Error saving settings');
      }
    } catch (error) {
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'upi', label: 'UPI Payment', icon: FiCreditCard },
    { id: 'cashfree', label: 'Cashfree Gateway', icon: FiCreditCard },
    { id: 'tracking', label: 'Analytics & Tracking', icon: FiTrendingUp },
    { id: 'site', label: 'Site Settings', icon: FiGlobe },
    { id: 'general', label: 'General', icon: FiSettings },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="spinner w-12 h-12"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your store configuration and integrations
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon
                    className={`
                      -ml-0.5 mr-2 h-5 w-5
                      ${
                        activeTab === tab.id
                          ? 'text-primary-500'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }
                    `}
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {/* UPI Settings Tab */}
          {activeTab === 'upi' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  UPI Payment Configuration
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="label">UPI ID</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="your-upi@bankname"
                      value={settings.upi.id}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          upi: { ...settings.upi, id: e.target.value },
                        })
                      }
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Enter your UPI ID for receiving payments
                    </p>
                  </div>

                  <div>
                    <label className="label">UPI Name (Optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Business Name"
                      value={settings.upi.name}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          upi: { ...settings.upi, name: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Payment Methods
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Enable or disable specific UPI payment methods
                    </p>

                    <div className="space-y-3">
                      {[
                        { key: 'Gpay', label: 'Google Pay', color: 'bg-blue-500' },
                        { key: 'Phonepe', label: 'PhonePe', color: 'bg-purple-500' },
                        { key: 'Phonepe2', label: 'PhonePe 2 (Direct Merchant Pay)', color: 'bg-purple-700' },
                        { key: 'Paytm', label: 'Paytm', color: 'bg-indigo-500' },
                        { key: 'Bhim', label: 'BHIM UPI', color: 'bg-orange-500' },
                        { key: 'WPay', label: 'W-Pay', color: 'bg-green-500' },
                      ].map((method) => (
                        <label
                          key={method.key}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full ${method.color} mr-3`}></div>
                            <span className="font-medium text-gray-900">
                              {method.label}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                            checked={settings.upi[method.key] || false}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                upi: {
                                  ...settings.upi,
                                  [method.key]: e.target.checked,
                                },
                              })
                            }
                          />
                        </label>
                      ))}
                    </div>

                    {settings.upi.Phonepe2 && (
                      <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg mt-4 space-y-4">
                        <h4 className="font-bold text-purple-950 text-sm">PhonePe 2 (Direct Pay) Settings</h4>
                        
                        <div>
                          <label className="label text-purple-900 text-xs font-semibold">PhonePe 2 UPI ID (pa)</label>
                          <input
                            type="text"
                            className="input border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                            placeholder="shivfashion710704.rzp@rxairtel"
                            value={settings.upi.Phonepe2UpiId || ''}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                upi: {
                                  ...settings.upi,
                                  Phonepe2UpiId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="label text-purple-900 text-xs font-semibold">PhonePe 2 Merchant Name (pn / tn)</label>
                          <input
                            type="text"
                            className="input border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                            placeholder="Flipkart Seller"
                            value={settings.upi.Phonepe2Name || ''}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                upi: {
                                  ...settings.upi,
                                  Phonepe2Name: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSave('upi')}
                    disabled={saving}
                    className="btn btn-primary w-full"
                  >
                    <FiSave className="mr-2" />
                    {saving ? 'Saving...' : 'Save UPI Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics & Tracking Tab */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              {/* Facebook Pixel */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Facebook Pixel
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Enable Facebook Pixel</p>
                      <p className="text-sm text-gray-600">
                        Track conversions and create custom audiences
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      checked={settings.facebookPixel.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          facebookPixel: {
                            ...settings.facebookPixel,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="label">Facebook Pixel ID</label>
                    <textarea
                      className="input"
                      rows="4"
                      placeholder="Paste your Facebook Pixel code here"
                      value={settings.facebookPixel.id}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          facebookPixel: {
                            ...settings.facebookPixel,
                            id: e.target.value,
                          },
                        })
                      }
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Get your Pixel ID from Facebook Events Manager
                    </p>
                  </div>

                  <button
                    onClick={() => handleSave('facebookPixel')}
                    disabled={saving}
                    className="btn btn-primary w-full"
                  >
                    <FiSave className="mr-2" />
                    {saving ? 'Saving...' : 'Save Facebook Pixel'}
                  </button>
                </div>
              </div>

              {/* Google Analytics */}
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Google Analytics
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        Enable Google Analytics
                      </p>
                      <p className="text-sm text-gray-600">
                        Track website traffic and user behavior
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      checked={settings?.googleAnalytics?.enabled}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          googleAnalytics: {
                            ...settings?.googleAnalytics,
                            enabled: e.target.checked,
                          },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="label">Measurement ID</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="G-XXXXXXXXXX"
                      value={settings?.googleAnalytics?.id}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          googleAnalytics: {
                            ...settings?.googleAnalytics,
                            id: e.target.value,
                          },
                        })
                      }
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Find your Measurement ID in Google Analytics 4
                    </p>
                  </div>

                  <button
                    onClick={() => handleSave('googleAnalytics')}
                    disabled={saving}
                    className="btn btn-primary w-full"
                  >
                    <FiSave className="mr-2" />
                    {saving ? 'Saving...' : 'Save Google Analytics'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Site Settings Tab */}
          {activeTab === 'site' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Site Configuration
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="label">Store Name</label>
                  <input
                    type="text"
                    className="input"
                    value={settings.site.name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        site: { ...settings.site, name: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Contact Email</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="store@example.com"
                      value={settings.site.email}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          site: { ...settings.site, email: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="label">Contact Phone</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="+91 1234567890"
                      value={settings.site.phone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          site: { ...settings.site, phone: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Currency</label>
                    <select
                      className="input"
                      value={settings.site.currency}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          site: { ...settings.site, currency: e.target.value },
                        })
                      }
                    >
                      <option value="INR">Indian Rupee (INR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Currency Symbol</label>
                    <input
                      type="text"
                      className="input"
                      value={settings.site.currencySymbol}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          site: {
                            ...settings.site,
                            currencySymbol: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSave('site')}
                  disabled={saving}
                  className="btn btn-primary w-full"
                >
                  <FiSave className="mr-2" />
                  {saving ? 'Saving...' : 'Save Site Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Cashfree Gateway Tab */}
          {activeTab === 'cashfree' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Cashfree Gateway Configuration
                </h2>

                <div className="space-y-4">
                  {/* Enable Gateway Toggle */}
                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-primary-500 mr-3"></div>
                      <div>
                        <span className="font-semibold text-gray-900 block">Enable Cashfree Gateway</span>
                        <span className="text-xs text-gray-500">Allow customers to pay via card, netbanking, wallets, etc.</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      checked={settings.payment?.cashfreeEnabled || false}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment: {
                            ...settings.payment,
                            cashfreeEnabled: e.target.checked,
                          },
                        })
                      }
                    />
                  </label>

                  {/* App ID */}
                  <div>
                    <label className="label">Cashfree App ID (Client ID)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. TEST10384725abc9"
                      value={settings.payment?.cashfreeAppId || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment: {
                            ...settings.payment,
                            cashfreeAppId: e.target.value,
                          },
                        })
                      }
                    />
                  </div>

                  {/* Secret Key */}
                  <div>
                    <label className="label">Cashfree Secret Key</label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        className="input pr-10"
                        placeholder="Enter your Cashfree Secret Key"
                        value={settings.payment?.cashfreeSecretKey || ''}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            payment: {
                              ...settings.payment,
                              cashfreeSecretKey: e.target.value,
                            },
                          })
                        }
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* Environment Mode */}
                  <div>
                    <label className="label">Gateway Mode</label>
                    <select
                      className="input"
                      value={settings.payment?.cashfreeMode || 'sandbox'}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          payment: {
                            ...settings.payment,
                            cashfreeMode: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="sandbox">Sandbox (Test Mode)</option>
                      <option value="production">Production (Live Mode)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Use sandbox for testing payments without actual money. Switch to production for real transactions.
                    </p>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSave('payment')}
                    disabled={saving}
                    className="btn btn-primary w-full mt-4"
                  >
                    <FiSave className="mr-2" />
                    {saving ? 'Saving...' : 'Save Cashfree Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                General Settings
              </h2>
              <p className="text-gray-600">
                Additional configuration options coming soon...
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
