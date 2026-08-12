// utils/facebookPixel.js

/**
 * Clean & Standardized Meta (Facebook) Pixel Helper for E-Commerce
 * STRICT FUNNEL FLOW: PageView -> ViewContent -> AddToCart -> InitiateCheckout -> AddPaymentInfo -> Purchase
 */

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

/**
 * Initialize Facebook Pixel with optional Advanced Matching user data
 */
export const initFacebookPixel = (pixelId, userData = {}) => {
  if (typeof window === 'undefined') return;
  
  if (!pixelId) {
    console.warn('Facebook Pixel ID not provided');
    return;
  }

  if (window._fb_pixel_initialized_id === pixelId) {
    return;
  }
  window._fb_pixel_initialized_id = pixelId;

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

  // Format advanced matching data if present
  const advancedMatching = {};
  if (userData.email) advancedMatching.em = String(userData.email).toLowerCase().trim();
  if (userData.phone) advancedMatching.ph = String(userData.phone).replace(/\D/g, '');
  if (userData.name) {
    const parts = userData.name.trim().split(' ');
    advancedMatching.fn = parts[0]?.toLowerCase();
    if (parts.length > 1) advancedMatching.ln = parts.slice(1).join(' ').toLowerCase();
  }

  window.fbq('init', pixelId, Object.keys(advancedMatching).length > 0 ? advancedMatching : undefined);
  console.log('✅ Facebook Pixel initialized:', pixelId);
};

// 1. PageView - Track page loads
export const pageview = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
  }
};

// 2. ViewContent - Track product detail views
export const trackViewContent = (product, eventId = null) => {
  if (typeof window !== 'undefined' && window.fbq && product) {
    const price = parseFloat(product.sellingPrice || product.price || product.selling_price || 0);
    const productId = String(product._id || product.id || '');

    const eventData = {
      content_name: product.title || product.title2 || product.name || 'Product',
      content_category: product.category || 'General',
      content_ids: productId ? [productId] : [],
      content_type: 'product',
      value: price,
      currency: 'INR',
    };

    const options = eventId ? { eventID: eventId } : {};
    window.fbq('track', 'ViewContent', eventData, options);
    console.log('📊 [Meta Pixel] ViewContent:', eventData.content_name, '₹' + price);
  }
};

// 3. AddToCart - Track adding item to cart
export const trackAddToCart = (product, quantity = 1, eventId = null) => {
  if (typeof window !== 'undefined' && window.fbq && product) {
    const price = parseFloat(product.sellingPrice || product.price || product.selling_price || 0);
    const productId = String(product._id || product.id || '');
    const qty = parseInt(quantity) || 1;

    const eventData = {
      content_name: product.title || product.title2 || product.name || 'Product',
      content_category: product.category || 'General',
      content_ids: productId ? [productId] : [],
      content_type: 'product',
      value: price * qty,
      currency: 'INR',
      num_items: qty,
    };

    const options = eventId ? { eventID: eventId } : {};
    window.fbq('track', 'AddToCart', eventData, options);
    console.log('🛒 [Meta Pixel] AddToCart:', eventData.content_name, 'x' + qty);
  }
};

// 4. InitiateCheckout - Track proceeding to address/checkout
export const trackInitiateCheckout = (cartItems = [], totalValue = 0, eventId = null) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const contentIds = items.map(item => String(item._id || item.id || '')).filter(Boolean);
    const contents = items.map(item => ({
      id: String(item._id || item.id || ''),
      quantity: parseInt(item.quantity) || 1,
      item_price: parseFloat(item.sellingPrice || item.price || item.selling_price || 0),
    }));

    const val = parseFloat(totalValue) || items.reduce((sum, i) => sum + (parseFloat(i.sellingPrice || i.price || 0) * (parseInt(i.quantity) || 1)), 0);

    const eventData = {
      content_ids: contentIds,
      contents: contents,
      content_type: 'product',
      value: val,
      currency: 'INR',
      num_items: items.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0),
    };

    const options = eventId ? { eventID: eventId } : {};
    window.fbq('track', 'InitiateCheckout', eventData, options);
    console.log('💳 [Meta Pixel] InitiateCheckout: ₹' + val, 'Items:', eventData.num_items);
  }
};

// 4b. AddShippingInfo - Track adding shipping info
export const trackAddShippingInfo = (cartItems = [], totalValue = 0, eventId = null) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const contentIds = items.map(item => String(item._id || item.id || '')).filter(Boolean);
    const eventData = {
      content_ids: contentIds,
      value: parseFloat(totalValue) || 0,
      currency: 'INR',
    };
    const options = eventId ? { eventID: eventId } : {};
    window.fbq('trackCustom', 'AddShippingInfo', eventData, options);
  }
};

// 5. AddPaymentInfo - Track selecting payment method
export const trackAddPaymentInfo = (paymentMethod = 'UPI', totalValue = 0, cartItems = [], eventId = null) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const contentIds = items.map(item => String(item._id || item.id || '')).filter(Boolean);

    const eventData = {
      payment_category: 'checkout',
      payment_option: paymentMethod,
      content_ids: contentIds,
      value: parseFloat(totalValue) || 0,
      currency: 'INR',
    };

    const options = eventId ? { eventID: eventId } : {};
    window.fbq('track', 'AddPaymentInfo', eventData, options);
    console.log('💳 [Meta Pixel] AddPaymentInfo:', paymentMethod, '₹' + totalValue);
  }
};

// 6. Purchase - Track order confirmation
export const trackPurchase = (orderData = {}, eventId = null) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const { orderId, items = [], totalValue = 0, currency = 'INR' } = orderData;
    const itemList = Array.isArray(items) ? items : [];

    const contentIds = itemList.map(item => String(item._id || item.id || '')).filter(Boolean);
    const contents = itemList.map(item => ({
      id: String(item._id || item.id || ''),
      quantity: parseInt(item.quantity) || 1,
      item_price: parseFloat(item.sellingPrice || item.price || item.selling_price || 0),
    }));

    const val = parseFloat(totalValue) || itemList.reduce((sum, i) => sum + (parseFloat(i.sellingPrice || i.price || 0) * (parseInt(i.quantity) || 1)), 0);

    const eventData = {
      content_ids: contentIds,
      contents: contents,
      content_type: 'product',
      value: val,
      currency: currency,
      num_items: itemList.reduce((sum, item) => sum + (parseInt(item.quantity) || 1), 0),
      order_id: String(orderId || ''),
    };

    const options = eventId ? { eventID: eventId } : {};
    window.fbq('track', 'Purchase', eventData, options);
    console.log('✅ [Meta Pixel] Purchase tracked! Order:', orderId, 'Value: ₹' + val);
  }
};

export const isPixelLoaded = () => {
  return typeof window !== 'undefined' && typeof window.fbq !== 'undefined';
};

export const getPixelId = async () => {
  try {
    const response = await fetch('/api/settings');
    const data = await response.json();
    if (data.success && data.data?.facebookPixel?.enabled && data.data?.facebookPixel?.id) {
      return data.data.facebookPixel.id;
    }
    return null;
  } catch (error) {
    console.error('Error fetching pixel ID:', error);
    return null;
  }
};
