// pages/checkout.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/user/Layout';
import { FiMapPin, FiCreditCard, FiTruck, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
  trackAddPaymentInfo, 
  trackAddShippingInfo, 
  trackPurchase 
} from '../utils/facebookPixel';

export default function Checkout() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [settings, setSettings] = useState(null);
  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Review
  const [loading, setLoading] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    loadCart();
    fetchSettings();
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (savedCart.length === 0) {
      toast.error('Your cart is empty');
      router.push('/cart');
      return;
    }
    setCart(savedCart);
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.sellingPrice * (item.quantity || 1));
    }, 0);
  };

  const calculateSavings = () => {
    return cart.reduce((savings, item) => {
      const mrpTotal = item.mrp * (item.quantity || 1);
      const sellingTotal = item.sellingPrice * (item.quantity || 1);
      return savings + (mrpTotal - sellingTotal);
    }, 0);
  };

  const validateAddress = () => {
    const required = ['fullName', 'phone', 'address', 'city', 'state', 'pincode'];
    
    for (let field of required) {
      if (!shippingAddress[field]) {
        toast.error(`Please fill ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    if (shippingAddress.phone.length !== 10) {
      toast.error('Phone number must be 10 digits');
      return false;
    }

    if (shippingAddress.pincode.length !== 6) {
      toast.error('Pincode must be 6 digits');
      return false;
    }

    return true;
  };

  const handleAddressSubmit = () => {
    if (!validateAddress()) return;
    
    // Track shipping info added
    trackAddShippingInfo('standard');
    
    setStep(2);
    toast.success('Address saved');
  };

  const handlePaymentSelect = (method) => {
    setPaymentMethod(method);
    
    // Track payment info added
    trackAddPaymentInfo(method);
    
    setStep(3);
    toast.success('Payment method selected');
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setLoading(true);

    try {
      // Generate order ID
      const orderId = 'ORD-' + Date.now();
      const total = calculateTotal();

      // Store order details & redirect to order confirmation (where canonical Purchase event fires)
      setTimeout(() => {
        const orderDetails = {
          orderId,
          items: cart,
          total,
          shippingAddress,
          paymentMethod,
          date: new Date().toISOString(),
        };
        localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

        // Redirect to canonical order summary page
        router.push(`/ordersummdary?order_id=${orderId}`);
      }, 1500);
    } catch (error) {
      toast.error('Failed to place order');
      setLoading(false);
    }
  };

  const total = calculateTotal();
  const savings = calculateSavings();
  const shippingCost = total >= 500 ? 0 : 40;
  const grandTotal = total + shippingCost;

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[
                { num: 1, label: 'Address', icon: FiMapPin },
                { num: 2, label: 'Payment', icon: FiCreditCard },
                { num: 3, label: 'Review', icon: FiCheckCircle },
              ].map((s, index) => {
                const Icon = s.icon;
                return (
                  <div key={s.num} className="flex items-center">
                    <div className={`flex items-center ${index > 0 ? 'ml-4' : ''}`}>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          step >= s.num
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {step > s.num ? (
                          <FiCheckCircle size={20} />
                        ) : (
                          <Icon size={20} />
                        )}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${
                        step >= s.num ? 'text-primary-600' : 'text-gray-500'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {index < 2 && (
                      <div className={`w-16 h-1 mx-2 ${
                        step > s.num ? 'bg-primary-600' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Shipping Address */}
              {step === 1 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <FiMapPin className="mr-2" />
                    Shipping Address
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Full Name *</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="John Doe"
                          value={shippingAddress.fullName}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="label">Phone Number *</label>
                        <input
                          type="tel"
                          className="input"
                          placeholder="9876543210"
                          maxLength="10"
                          value={shippingAddress.phone}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Address *</label>
                      <textarea
                        className="input"
                        rows="3"
                        placeholder="House No., Building Name, Street"
                        value={shippingAddress.address}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, address: e.target.value })
                        }
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">City *</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Mumbai"
                          value={shippingAddress.city}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, city: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="label">State *</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Maharashtra"
                          value={shippingAddress.state}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, state: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Pincode *</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="400001"
                          maxLength="6"
                          value={shippingAddress.pincode}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, pincode: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="label">Landmark (Optional)</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Near Central Mall"
                          value={shippingAddress.landmark}
                          onChange={(e) =>
                            setShippingAddress({ ...shippingAddress, landmark: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddressSubmit}
                      className="btn btn-primary w-full mt-6"
                    >
                      Continue to Payment
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {step === 2 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <FiCreditCard className="mr-2" />
                    Payment Method
                  </h2>

                  <div className="space-y-4">
                    {/* UPI Payment Options */}
                    {settings?.upi && (
                      <div className="space-y-3">
                        <h3 className="font-medium text-gray-900 mb-3">UPI Payment</h3>
                        
                        {settings.upi.Gpay && (
                          <button
                            onClick={() => handlePaymentSelect('Google Pay')}
                            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                  <span className="text-blue-600 font-bold">G</span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">Google Pay</p>
                                  <p className="text-sm text-gray-600">UPI Payment</p>
                                </div>
                              </div>
                            </div>
                          </button>
                        )}

                        {settings.upi.Phonepe && (
                          <button
                            onClick={() => handlePaymentSelect('PhonePe')}
                            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                  <span className="text-purple-600 font-bold">P</span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">PhonePe</p>
                                  <p className="text-sm text-gray-600">UPI Payment</p>
                                </div>
                              </div>
                            </div>
                          </button>
                        )}

                        {settings.upi.Paytm && (
                          <button
                            onClick={() => handlePaymentSelect('Paytm')}
                            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                  <span className="text-indigo-600 font-bold">₹</span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">Paytm</p>
                                  <p className="text-sm text-gray-600">UPI Payment</p>
                                </div>
                              </div>
                            </div>
                          </button>
                        )}

                        {settings.upi.Bhim && (
                          <button
                            onClick={() => handlePaymentSelect('BHIM UPI')}
                            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                  <span className="text-orange-600 font-bold">B</span>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">BHIM UPI</p>
                                  <p className="text-sm text-gray-600">UPI Payment</p>
                                </div>
                              </div>
                            </div>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Cash on Delivery */}
                    <div className="pt-4 border-t">
                      <h3 className="font-medium text-gray-900 mb-3">Other Methods</h3>
                      <button
                        onClick={() => handlePaymentSelect('Cash on Delivery')}
                        className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all text-left"
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-green-600 font-bold">₹</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Cash on Delivery</p>
                            <p className="text-sm text-gray-600">Pay when you receive</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(1)}
                    className="btn btn-secondary w-full mt-6"
                  >
                    Back to Address
                  </button>
                </div>
              )}

              {/* Step 3: Review Order */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Address Summary */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Delivery Address</h3>
                      <button
                        onClick={() => setStep(1)}
                        className="text-primary-600 text-sm hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <div className="text-gray-700">
                      <p className="font-medium">{shippingAddress.fullName}</p>
                      <p className="mt-1">{shippingAddress.address}</p>
                      <p>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.pincode}</p>
                      <p className="mt-1">Phone: {shippingAddress.phone}</p>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Payment Method</h3>
                      <button
                        onClick={() => setStep(2)}
                        className="text-primary-600 text-sm hover:underline"
                      >
                        Change
                      </button>
                    </div>
                    <p className="text-gray-700">{paymentMethod}</p>
                  </div>

                  {/* Order Items */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item._id} className="flex items-center space-x-4">
                          <img
                            src={item.mainImage || item.images?.[0] || '/placeholder.png'}
                            alt={item.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity || 1}</p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ₹{item.sellingPrice * (item.quantity || 1)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn btn-primary w-full"
                  >
                    {loading ? (
                      <>
                        <div className="spinner w-5 h-5 mr-2 border-2"></div>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="mr-2" />
                        Place Order - ₹{grandTotal}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h3 className="font-semibold text-gray-900 mb-4">Order Summary</h3>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Subtotal ({cart.length} items)</span>
                    <span>₹{total + savings}</span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{savings}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Shipping</span>
                    <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                      {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                    </span>
                  </div>
                  {total < 500 && (
                    <p className="text-xs text-gray-600">
                      Add ₹{500 - total} more for FREE shipping
                    </p>
                  )}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₹{grandTotal}</span>
                  </div>
                </div>

                {savings > 0 && (
                  <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm">
                    🎉 You're saving ₹{savings}!
                  </div>
                )}

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <FiTruck className="mt-1 flex-shrink-0" />
                    <p>Estimated delivery in 5-7 business days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
