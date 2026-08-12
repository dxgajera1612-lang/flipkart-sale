// models/Settings.js
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // UPI Settings
  upi: {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      default: '',
    },
    Gpay: {
      type: Boolean,
      default: true,
    },
    Phonepe: {
      type: Boolean,
      default: true,
    },
    Phonepe2: {
      type: Boolean,
      default: false,
    },
    Phonepe2UpiId: {
      type: String,
      default: '',
    },
    Phonepe2Name: {
      type: String,
      default: 'Flipkart Seller',
    },
    Paytm: {
      type: Boolean,
      default: true,
    },
    Bhim: {
      type: Boolean,
      default: true,
    },
    WPay: {
      type: Boolean,
      default: false,
    },
  },
  
  // Facebook Pixel
  facebookPixel: {
    id: {
      type: String,
      default: '',
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    customCode: {
      type: String,
      default: '',
    },
    capiAccessToken: {
      type: String,
      default: '',
      trim: true,
    },
    testEventCode: {
      type: String,
      default: '',
      trim: true,
    },
    events: [
      {
        name: {
          type: String,
          default: '',
        },
        code: {
          type: String,
          default: '',
        },
        enabled: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  
  // Google Analytics
  googleAnalytics: {
    id: {
      type: String,
      default: '',
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
  },
  
  // Site Settings
  site: {
    name: {
      type: String,
      default: 'Flipkart Store',
    },
    logo: {
      type: String,
      default: '',
    },
    favicon: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
  },
  
  // Shipping Settings
  shipping: {
    freeShippingThreshold: {
      type: Number,
      default: 500,
    },
    standardShippingCost: {
      type: Number,
      default: 40,
    },
    expressShippingCost: {
      type: Number,
      default: 100,
    },
    estimatedDeliveryDays: {
      type: String,
      default: '5-7 days',
    },
  },
  
  // Tax Settings
  tax: {
    enabled: {
      type: Boolean,
      default: false,
    },
    gstPercentage: {
      type: Number,
      default: 18,
    },
  },
  
  // Payment Settings
  payment: {
    codEnabled: {
      type: Boolean,
      default: true,
    },
    onlinePaymentEnabled: {
      type: Boolean,
      default: true,
    },
    razorpayKey: {
      type: String,
      default: '',
    },
    razorpaySecret: {
      type: String,
      default: '',
    },
    cashfreeEnabled: {
      type: Boolean,
      default: false,
    },
    cashfreeAppId: {
      type: String,
      default: '',
    },
    cashfreeSecretKey: {
      type: String,
      default: '',
    },
    cashfreeMode: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox',
    },
  },
  
  // Email Settings
  email: {
    orderConfirmation: {
      type: Boolean,
      default: true,
    },
    orderShipped: {
      type: Boolean,
      default: true,
    },
    orderDelivered: {
      type: Boolean,
      default: true,
    },
  },
  
  // SMS Settings
  sms: {
    enabled: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      default: '',
    },
    apiKey: {
      type: String,
      default: '',
    },
  },
  
  // Maintenance Mode
  maintenance: {
    enabled: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: 'We are currently under maintenance. Please check back soon.',
    },
  },
}, {
  timestamps: true,
});

export default mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
