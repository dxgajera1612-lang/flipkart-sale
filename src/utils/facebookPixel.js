// utils/facebookPixel.js

/**
 * Facebook Pixel Events for E-Commerce
 * Comprehensive tracking for optimal ad performance
 */

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

// Initialize Facebook Pixel
export const initFacebookPixel = (pixelId) => {
  if (typeof window === 'undefined') return;
  
  if (!pixelId) {
    console.warn('Facebook Pixel ID not provided');
    return;
  }

  // Load Facebook Pixel Base Code
  !(function(f,b,e,v,n,t,s) {
    if(f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments)
    };
    if(!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js'));

  window.fbq('init', pixelId);
  console.log('✅ Facebook Pixel initialized:', pixelId);
};

// Track PageView
export const pageview = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

// Standard Events for E-Commerce

/**
 * ViewContent - Track when user views a product
 * @param {Object} product - Product object with details
 */
export const trackViewContent = (product) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: product.title || product.name,
      content_category: product.category || 'General',
      content_ids: [product._id || product.id],
      content_type: 'product',
      value: product.sellingPrice || product.price || 0,
      currency: 'INR',
    });
    console.log('📊 FB Pixel: ViewContent tracked', product.title);
  }
};

/**
 * AddToCart - Track when user adds item to cart
 * @param {Object} product - Product object
 * @param {Number} quantity - Quantity added
 */
export const trackAddToCart = (product, quantity = 1) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_name: product.title || product.name,
      content_category: product.category || 'General',
      content_ids: [product._id || product.id],
      content_type: 'product',
      value: (product.sellingPrice || product.price || 0) * quantity,
      currency: 'INR',
      num_items: quantity,
    });
    console.log('🛒 FB Pixel: AddToCart tracked', product.title, 'x', quantity);
  }
};

/**
 * InitiateCheckout - Track when user starts checkout
 * @param {Array} cartItems - Array of cart items
 * @param {Number} totalValue - Total cart value
 */
export const trackInitiateCheckout = (cartItems, totalValue) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const contentIds = cartItems.map(item => item._id || item.id);
    const contents = cartItems.map(item => ({
      id: item._id || item.id,
      quantity: item.quantity || 1,
      item_price: item.sellingPrice || item.price || 0,
    }));

    window.fbq('track', 'InitiateCheckout', {
      content_ids: contentIds,
      contents: contents,
      content_type: 'product',
      value: totalValue,
      currency: 'INR',
      num_items: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    });
    console.log('💳 FB Pixel: InitiateCheckout tracked, value:', totalValue);
  }
};

/**
 * Purchase - Track successful purchase (MOST IMPORTANT)
 * @param {Object} orderData - Order details
 */
export const trackPurchase = (orderData) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const { orderId, items, totalValue, currency = 'INR' } = orderData;
    
    const contentIds = items.map(item => item._id || item.id);
    const contents = items.map(item => ({
      id: item._id || item.id,
      quantity: item.quantity || 1,
      item_price: item.sellingPrice || item.price || 0,
    }));

    window.fbq('track', 'Purchase', {
      content_ids: contentIds,
      contents: contents,
      content_type: 'product',
      value: totalValue,
      currency: currency,
      num_items: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      order_id: orderId,
    });
    console.log('✅ FB Pixel: Purchase tracked, Order ID:', orderId, 'Value:', totalValue);
  }
};

/**
 * AddToWishlist - Track when user adds to wishlist
 * @param {Object} product - Product object
 */
export const trackAddToWishlist = (product) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToWishlist', {
      content_name: product.title || product.name,
      content_category: product.category || 'General',
      content_ids: [product._id || product.id],
      content_type: 'product',
      value: product.sellingPrice || product.price || 0,
      currency: 'INR',
    });
    console.log('❤️ FB Pixel: AddToWishlist tracked', product.title);
  }
};

/**
 * Search - Track when user searches
 * @param {String} searchQuery - Search term
 */
export const trackSearch = (searchQuery) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Search', {
      search_string: searchQuery,
    });
    console.log('🔍 FB Pixel: Search tracked:', searchQuery);
  }
};

/**
 * ViewCategory - Track when user views a category
 * @param {String} categoryName - Category name
 * @param {Number} productCount - Number of products in category
 */
export const trackViewCategory = (categoryName, productCount = 0) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'ViewCategory', {
      category: categoryName,
      num_items: productCount,
    });
    console.log('📁 FB Pixel: ViewCategory tracked:', categoryName);
  }
};

/**
 * CompleteRegistration - Track user registration
 * @param {String} registrationMethod - How user registered
 */
export const trackCompleteRegistration = (registrationMethod = 'email') => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      status: 'completed',
      registration_method: registrationMethod,
    });
    console.log('👤 FB Pixel: CompleteRegistration tracked');
  }
};

/**
 * Lead - Track lead generation
 * @param {Object} leadData - Lead information
 */
export const trackLead = (leadData = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', leadData);
    console.log('📝 FB Pixel: Lead tracked');
  }
};

/**
 * Contact - Track when user contacts support
 */
export const trackContact = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Contact');
    console.log('📞 FB Pixel: Contact tracked');
  }
};

/**
 * Custom Event - Track custom events
 * @param {String} eventName - Custom event name
 * @param {Object} data - Event data
 */
export const trackCustomEvent = (eventName, data = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, data);
    console.log('⚡ FB Pixel: Custom event tracked:', eventName);
  }
};

// Advanced Tracking

/**
 * Track when user removes item from cart
 */
export const trackRemoveFromCart = (product, quantity = 1) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'RemoveFromCart', {
      content_name: product.title || product.name,
      content_ids: [product._id || product.id],
      value: (product.sellingPrice || product.price || 0) * quantity,
      currency: 'INR',
      num_items: quantity,
    });
    console.log('🗑️ FB Pixel: RemoveFromCart tracked', product.title);
  }
};

/**
 * Track when user updates cart quantity
 */
export const trackUpdateCart = (cartItems, totalValue) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'UpdateCart', {
      content_ids: cartItems.map(item => item._id || item.id),
      value: totalValue,
      currency: 'INR',
      num_items: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    });
    console.log('🔄 FB Pixel: UpdateCart tracked');
  }
};

/**
 * Track payment info addition
 * @param {String} paymentMethod - Payment method name
 * @param {Number} value - Cart total value (for Revenue optimization)
 */
export const trackAddPaymentInfo = (paymentMethod, value = 0) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddPaymentInfo', {
      payment_method: paymentMethod,
      value: value,
      currency: 'INR',
    });
    console.log('💳 FB Pixel: AddPaymentInfo tracked:', paymentMethod, '₹' + value);
  }
};

/**
 * Track shipping info addition
 */
export const trackAddShippingInfo = (shippingMethod) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'AddShippingInfo', {
      shipping_method: shippingMethod,
    });
    console.log('🚚 FB Pixel: AddShippingInfo tracked');
  }
};

/**
 * Track when user views cart
 */
export const trackViewCart = (cartItems, totalValue) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'ViewCart', {
      content_ids: cartItems.map(item => item._id || item.id),
      value: totalValue,
      currency: 'INR',
      num_items: cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
    });
    console.log('👁️ FB Pixel: ViewCart tracked');
  }
};

/**
 * Track product impressions (when products are visible)
 */
export const trackProductImpression = (products) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'ProductImpression', {
      content_ids: products.map(p => p._id || p.id),
      num_items: products.length,
    });
    console.log('👀 FB Pixel: ProductImpression tracked, count:', products.length);
  }
};

/**
 * Track when user shares a product
 */
export const trackShare = (product, shareMethod = 'social') => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'Share', {
      content_name: product.title || product.name,
      content_id: product._id || product.id,
      share_method: shareMethod,
    });
    console.log('📤 FB Pixel: Share tracked');
  }
};

// Helper function to check if pixel is loaded
export const isPixelLoaded = () => {
  return typeof window !== 'undefined' && typeof window.fbq !== 'undefined';
};

// Get pixel ID from settings
export const getPixelId = async () => {
  try {
    const response = await fetch('/api/settings');
    const data = await response.json();
    
    if (data.success && data.data.facebookPixel?.enabled && data.data.facebookPixel?.id) {
      return data.data.facebookPixel.id;
    }
    return null;
  } catch (error) {
    console.error('Error fetching pixel ID:', error);
    return null;
  }
};
