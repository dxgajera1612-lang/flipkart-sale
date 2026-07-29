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
      customCode: '',
      capiAccessToken: '',
      testEventCode: '',
      events: [],
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
        setSettings(prev => ({ ...prev, ...data.data }));
        alert('Settings saved successfully!');
      } else {
        alert(data.message || 'Error saving settings');
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
      <div className="space-y-5 max-w-6xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Admin Settings</h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            Configure your store gateway, site branding, and tracking setup in a polished admin workflow with cleaner spacing and clearer UI alignment.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex flex-wrap gap-3 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />
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
            <div className="space-y-5">
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

                    <div className="space-y-2">
                      {[
                        { key: 'Gpay', label: 'Google Pay', color: 'bg-blue-500' },
                        { key: 'Phonepe', label: 'PhonePe', color: 'bg-purple-500' },
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
            <div className="space-y-5">
              {/* Facebook Pixel */}
              <div className="card">
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
                  Facebook Pixel
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Enable Facebook Pixel</p>
                      <p className="text-sm text-gray-600">
                        Track conversions and manage pixel event code from one place.
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
                    <input
                      type="text"
                      className="input"
                      placeholder="Enter your Pixel ID"
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
                      Get your Pixel ID from Facebook Events Manager.
                    </p>
                  </div>

                  <div>
                    <label className="label">Meta Conversions API (CAPI) Access Token <span className="text-xs text-emerald-600 font-semibold">(10/10 Tracking)</span></label>
                    <input
                      type="password"
                      className="input"
                      placeholder="EAA..."
                      value={settings.facebookPixel.capiAccessToken || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          facebookPixel: {
                            ...settings.facebookPixel,
                            capiAccessToken: e.target.value,
                          },
                        })
                      }
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Server-side Access Token generated from Meta Events Manager &gt; Settings &gt; Generate Access Token.
                    </p>
                  </div>

                  <div>
                    <label className="label">Meta Test Event Code (Optional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="TEST12345"
                      value={settings.facebookPixel.testEventCode || ''}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          facebookPixel: {
                            ...settings.facebookPixel,
                            testEventCode: e.target.value,
                          },
                        })
                      }
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Found in Meta Events Manager &gt; Test Events (e.g. TEST12345).
                    </p>
                  </div>

                  <div>
                    <label className="label">Custom Pixel Script</label>
                    <textarea
                      className="input font-mono"
                      rows="6"
                      placeholder="Paste your full pixel script or event code here"
                      value={settings.facebookPixel.customCode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          facebookPixel: {
                            ...settings.facebookPixel,
                            customCode: e.target.value,
                          },
                        })
                      }
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Use this to store custom pixel or event code snippets that should run with your pixel.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Custom Pixel Events</p>
                        <p className="text-sm text-gray-500">
                          Add event names and code snippets to fire custom pixel events.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() =>
                          setSettings({
                            ...settings,
                            facebookPixel: {
                              ...settings.facebookPixel,
                              events: [
                                ...(settings.facebookPixel.events || []),
                                { name: '', code: '', enabled: true },
                              ],
                            },
                          })
                        }
                      >
                        Add Event
                      </button>
                    </div>

                    {(settings.facebookPixel.events || []).map((event, index) => (
                      <div key={index} className="rounded-xl border border-gray-200 p-3 bg-slate-50">
                        <div className="grid gap-4 md:grid-cols-3 items-end">
                          <div>
                            <label className="label">Event Name</label>
                            <input
                              type="text"
                              className="input"
                              value={event.name}
                              onChange={(e) => {
                                const updated = [...(settings.facebookPixel.events || [])];
                                updated[index] = { ...updated[index], name: e.target.value };
                                setSettings({
                                  ...settings,
                                  facebookPixel: {
                                    ...settings.facebookPixel,
                                    events: updated,
                                  },
                                });
                              }}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="label">Event Code</label>
                            <textarea
                              className="input font-mono"
                              rows="3"
                              value={event.code}
                              onChange={(e) => {
                                const updated = [...(settings.facebookPixel.events || [])];
                                updated[index] = { ...updated[index], code: e.target.value };
                                setSettings({
                                  ...settings,
                                  facebookPixel: {
                                    ...settings.facebookPixel,
                                    events: updated,
                                  },
                                });
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-primary-600 rounded border-gray-300"
                              checked={event.enabled}
                              onChange={(e) => {
                                const updated = [...(settings.facebookPixel.events || [])];
                                updated[index] = { ...updated[index], enabled: e.target.checked };
                                setSettings({
                                  ...settings,
                                  facebookPixel: {
                                    ...settings.facebookPixel,
                                    events: updated,
                                  },
                                });
                              }}
                            />
                            Enabled
                          </label>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => {
                              const updated = [...(settings.facebookPixel.events || [])];
                              updated.splice(index, 1);
                              setSettings({
                                ...settings,
                                facebookPixel: {
                                  ...settings.facebookPixel,
                                  events: updated,
                                },
                              });
                            }}
                          >
                            Remove Event
                          </button>
                        </div>
                      </div>
                    ))}
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
                <h2 className="text-2xl font-semibold text-slate-900 mb-4">
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
            <div className="card space-y-5">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                  Cashfree Gateway
                </h2>
                <p className="text-sm leading-6 text-slate-600">
                  Activate and configure Cashfree payments for your store. Keep only the fields you need for fast gateway management.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-900">Enable Cashfree</p>
                    <p className="text-sm text-slate-500">Accept cards, wallets, netbanking, and UPI via Cashfree.</p>
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

                <div>
                  <label className="label">Cashfree App ID</label>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Environment Mode</label>
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
                  <p className="mt-1 text-sm text-slate-500">
                    Sandbox is for testing. Switch to production only after verifying your Cashfree account.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleSave('payment')}
                disabled={saving}
                className="btn btn-primary w-full"
              >
                <FiSave className="mr-2" />
                {saving ? 'Saving...' : 'Save Cashfree Settings'}
              </button>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
