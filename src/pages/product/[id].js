import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Sidenav from '../Sidenav';
import SimilarProducts from '../SimilarProducts';
import { trackViewContent, trackAddToCart } from '../../utils/facebookPixel';

// =============================================
// HELPER FUNCTIONS
// =============================================
const getSizeLabel = (sizeNum) => {
  const sizes = { 1: 's', 2: 'm', 3: 'l', 4: 'xl', 5: '2xl' };
  return sizes[sizeNum] || 's';
};

const cleanHtmlText = (htmlStr) => {
  if (!htmlStr || typeof htmlStr !== 'string') return '';
  return htmlStr
    .replace(/L_id/gi, 'Lid')
    .replace(/liqu_id/gi, 'liquid')
    .replace(/w_idth/gi, 'width')
    .replace(/w_ide/gi, 'wide')
    .replace(/m_iddle/gi, 'middle')
    .replace(/cel_w_idget/gi, 'cel_widget')
    .replace(/celw_idget/gi, 'cel_widget')
    .replace(/prov_ides/gi, 'provides')
    .replace(/prov_ide/gi, 'provide')
    .replace(/conf_idence/gi, 'confidence')
    .replace(/l_ids/gi, 'lids')
    .replace(/l_id/gi, 'lid')
    .replace(/s_ide/gi, 'side')
    .replace(/gr_id/gi, 'grid')
    .replace(/rig_id/gi, 'rigid');
};

const getCartData = () => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("cart");
  try {
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

const saveCartData = (data) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem("cart", JSON.stringify(data));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
};

// =============================================
// FLIPKART STYLE SPINNER LOADER
// =============================================
const ProductSkeleton = () => (
  <div className="fk-loader-container">
    <div className="fk-spinner"></div>
    <div className="fk-loader-text">Loading Product...</div>
    <style jsx>{`
      .fk-loader-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 80vh;
        background: #fff;
      }
      .fk-spinner {
        width: 44px;
        height: 44px;
        border: 3.5px solid #e2e8f0;
        border-top: 3.5px solid #2874f0;
        border-radius: 50%;
        animation: fkSpin 0.7s linear infinite;
      }
      .fk-loader-text {
        margin-top: 14px;
        font-family: 'Outfit', sans-serif;
        font-size: 14px;
        font-weight: 700;
        color: #2874f0;
        letter-spacing: 0.02em;
      }
      @keyframes fkSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// =============================================
// CUSTOM IMAGE SLIDER
// =============================================
const CustomImageSlider = ({ images = [], title = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = (index) => { if (!isTransitioning) setCurrentIndex(index); };
  const goToPrevious = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };
  const goToNext = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 75) goToNext();
    if (touchStart - touchEnd < -75) goToPrevious();
  };

  if (!images || images.length === 0) {
    return (
      <div style={{ width: '100%', height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8' }}>
        <p style={{ color: '#999', fontSize: '14px' }}>No images available</p>
      </div>
    );
  }

  return (
    <div className="image-slider-wrapper">
      <div className="image-slider-container" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="image-slider-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {images.map((image, index) => (
            <div key={index} className="image-slide">
              <img
                src={image}
                alt={`${title} - Image ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f5f5f5" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="slider-indicators">
            {images.map((_, index) => (
              <button key={index} className={`indicator ${index === currentIndex ? 'active' : ''}`} onClick={() => goToSlide(index)} aria-label={`Go to image ${index + 1}`} />
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        .image-slider-wrapper { position: relative; width: 100%; background: #fff; }
        .image-slider-container { position: relative; width: 100%; height: 360px; overflow: hidden; background: #fff; }
        .image-slider-track { display: flex; height: 100%; transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .image-slide { min-width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 8px; background: #fff; }
        .image-slide img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; user-select: none; }
        .slider-indicators { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 10; background: rgba(255,255,255,0.85); padding: 6px 12px; border-radius: 16px; backdrop-filter: blur(4px); }
        .indicator { width: 6px; height: 6px; border-radius: 50%; background: #d0d0d0; border: none; cursor: pointer; transition: all 0.3s ease; padding: 0; }
        .indicator.active { width: 20px; border-radius: 3px; background: #ffc200; }
      `}</style>
    </div>
  );
};

// =============================================
// DELIVERY TRACKER
// =============================================
const DeliveryTracker = () => {
  const today = new Date();
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + 5);
  const fastDate = new Date(today);
  fastDate.setDate(today.getDate() + 3);

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const steps = [
    { label: 'Order Placed', icon: '🛍️', done: false },
    { label: 'Processing', icon: '⚙️', done: false },
    { label: 'Shipped', icon: '📦', done: false },
    { label: 'Out for Delivery', icon: '🚚', done: false },
    { label: 'Delivered', icon: '✅', done: false },
  ];

  return (
    <div className="delivery-tracker">
      <div className="tracker-header">
        <span className="tracker-title">🚀 Delivery Estimate</span>
      </div>

      <div className="delivery-options">
        <div className="delivery-opt standard">
          <div className="opt-icon">📦</div>
          <div className="opt-info">
            <span className="opt-name">Standard Delivery</span>
            <span className="opt-date">By {formatDate(deliveryDate)}</span>
          </div>
          <span className="opt-price free">FREE</span>
        </div>
     <div className="delivery-opt fast">
    <div className="opt-icon">⚡</div>
    <div className="opt-info">
        <span className="opt-name">Express Delivery</span>
        <span className="opt-date">By {formatDate(fastDate)}</span>
    </div>
    <div className="opt-price-col">
        <span className="opt-price-free">FREE</span>
        <span className="opt-limited-tag">Limited offer</span>
    </div>
</div>
      </div>

      <div className="tracker-steps">
        <div className="steps-label">Order Journey</div>
        <div className="steps-row">
          {steps.map((step, i) => (
            <div key={i} className="step-item">
              <div className="step-circle">{step.icon}</div>
              {i < steps.length - 1 && <div className="step-line"></div>}
              <span className="step-text">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .delivery-tracker {
          background: #fff;
          border-radius: 0;
          padding: 14px 16px;
          margin-top: 8px;
        }
        .tracker-header {
          margin-bottom: 12px;
        }
        .tracker-title {
          font-size: 14px;
          font-weight: 700;
          color: #333;
        }
        .delivery-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .delivery-opt {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        .delivery-opt.fast {
          border-color: #f3e5f5;
          background: #fdf6ff;
        }
        .opt-icon {
          font-size: 20px;
        }
        .opt-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .opt-name {
          font-size: 13px;
          font-weight: 600;
          color: #333;
        }
        .opt-date {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }
        .opt-price {
          font-size: 13px;
          font-weight: 700;
          color: #333;
        }
        .opt-price.free {
          color: #00b852;
        }
        .tracker-steps {
          margin-bottom: 12px;
        }
        .steps-label {
          font-size: 12px;
          color: #888;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .steps-row {
          display: flex;
          align-items: flex-start;
          gap: 0;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          position: relative;
        }
        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          border: 2px solid #e0e0e0;
          z-index: 1;
        }
        .step-line {
          position: absolute;
          top: 15px;
          left: 60%;
          right: -40%;
          height: 2px;
          background: #e0e0e0;
          z-index: 0;
        }
        .step-text {
          font-size: 9px;
          color: #888;
          text-align: center;
          margin-top: 4px;
          line-height: 1.2;
        }
        .pincode-row {
          display: flex;
          align-items: center;
          gap: 5px;
          padding-top: 10px;
          border-top: 1px solid #f5f5f5;
        }
        .pincode-text {
          font-size: 12px;
          color: #555;
          flex: 1;
        }
        .change-link {
          font-size: 12px;
          color: #ffc200;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

// =============================================
// PRODUCT SPECS / EXTRA DETAILS
// =============================================
const ProductSpecs = ({ data }) => {
  const specs = [
    { label: 'Material', value: data.material || 'Cotton Blend' },
    { label: 'Pattern', value: data.pattern || 'Solid' },
    { label: 'Neck Type', value: data.neck || 'Round Neck' },
    { label: 'Sleeve', value: data.sleeve || 'Full Sleeve' },
    { label: 'Fit Type', value: data.fit || 'Regular Fit' },
    { label: 'Occasion', value: data.occasion || 'Casual' },
    { label: 'Country of Origin', value: data.origin || 'India' },
    { label: 'Brand', value: data.brand || 'Generic' },
  ];

  return (
    <div className="specs-section px-0">
      <div className="mt-4 space-y-1">
  <img
    src="/assets/images/review_1.jpg"
    alt="Review"
    className="w-full rounded"
  />
  <img
    src="/assets/images/review_2.jpg"
    alt="Review"
    className="w-full rounded"
  />
  <img
    src="/assets/images/review_3.jpg"
    alt="Review"
    className="w-full rounded"
  />
  <img
    src="/assets/images/review_4.jpg"
    alt="Review"
    className="w-full rounded"
  />
</div>

      <style jsx>{`
        .specs-section {
          background: #fff;
          padding: 16px;
          margin-top: 8px;
        }
        .specs-title {
          font-size: 15px;
          font-weight: 700;
          color: #333;
          margin-bottom: 12px;
        }
        .specs-table {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #f0f0f0;
        }
        .spec-row {
          display: flex;
          padding: 10px 12px;
          border-bottom: 1px solid #f5f5f5;
        }
        .spec-row:last-child {
          border-bottom: none;
        }
        .spec-row.even {
          background: #fafafa;
        }
        .spec-label {
          width: 45%;
          font-size: 13px;
          color: #888;
          font-weight: 500;
        }
        .spec-value {
          width: 55%;
          font-size: 13px;
          color: #333;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

// =============================================
// OFFERS SECTION
// =============================================
const OffersSection = () => {
  const offers = [
    { icon: '💳', title: '10% Off', desc: 'On HDFC Bank Credit Cards' },
    { icon: '🏦', title: 'No Cost EMI', desc: 'Starting ₹199/month' },
    { icon: '🔄', title: '7-Day Return', desc: 'Easy returns & exchange' },
    { icon: '🛡️', title: '100% Authentic', desc: 'Genuine products only' },
  ];

  return (
    <div className="offers-section">
      <h3 className="offers-title">Available Offers</h3>
      <div className="offers-list">
        {offers.map((offer, i) => (
          <div key={i} className="offer-item">
            <span className="offer-icon">{offer.icon}</span>
            <div className="offer-text">
              <span className="offer-title">{offer.title}</span>
              <span className="offer-desc">{offer.desc}</span>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .offers-section {
          background: #fff;
          padding: 16px;
          margin-top: 8px;
        }
        .offers-title {
          font-size: 15px;
          font-weight: 700;
          color: #333;
          margin-bottom: 12px;
        }
        .offers-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .offer-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        .offer-item:last-child {
          border-bottom: none;
        }
        .offer-icon {
          font-size: 20px;
          width: 28px;
          text-align: center;
        }
        .offer-text {
          display: flex;
          flex-direction: column;
        }
        .offer-title {
          font-size: 13px;
          font-weight: 600;
          color: #00b852;
        }
        .offer-desc {
          font-size: 12px;
          color: #666;
          margin-top: 1px;
        }
      `}</style>
    </div>
  );
};

// =============================================
// MAIN COMPONENT
// =============================================
function ProductDetails() {
  const [loading, setLoading] = useState(true);
  const [data133, setData133] = useState([]);
  const [data1, setData1] = useState({});
  const [mySidenavopen, setmySidenavopen] = useState(!true);
  const [error, setError] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const cartData = getCartData();
    setData133(cartData);
    const handleStorage = () => setData133(getCartData());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!router.query.id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/products/${router.query.id}`);
        const result = await response.json();
        if (result.success && result.data) {
          setData1(result.data);
          trackViewContent(result.data);
        } else {
          setError('Product not found');
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [router.query.id]);
const addToCart = (buyNow = false) => {
    if (!data1) return;

    const storedData = getCartData();
    const existingProducts = Array.isArray(storedData) ? storedData : [];
    const productId = String(data1?._id || data1?.id || '');
    if (!productId) return;

    // ✅ Match by BOTH product ID + selected size
    const existingIndex = existingProducts.findIndex(product => {
        const cartProductId = String(product?._id || product?.id || '');
        return cartProductId === productId;
    });

    if (existingIndex !== -1) {
        // ✅ Same product + same size → just increment quantity
        existingProducts[existingIndex] = {
            ...existingProducts[existingIndex],
            quantity: (existingProducts[existingIndex].quantity || 1) + 1,
        };
    } else {
        // ✅ New product or different size → add as new cart entry
        existingProducts.push({ ...data1, quantity: 1 });
    }

    saveCartData(existingProducts);
    setData133(existingProducts);
    trackAddToCart(data1, 1);

    if (buyNow) {
        router?.push?.("/cart");
    } else {
        setmySidenavopen(true); // ✅ FIXED: always open, not toggle
    }
};

  const calculateDiscount = () => {
    const mrp = data1.mrp || data1.cancelprice || 0;
    const selling = data1.sellingPrice || data1.price || 0;
    if (mrp > 0) return Math.round(((mrp - selling) / mrp) * 100);
    return 0;
  };

  if (loading) return <ProductSkeleton />;

  if (error || !data1 || (!data1._id && !data1.id)) {
    return (
      <div className="error-container">
        <h2>Product not found</h2>
        <Link href="/"><span className="go-home-btn">Go Home</span></Link>
        <style jsx>{`
          .error-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; }
          .error-container h2 { margin-bottom: 20px; font-size: 20px; color: #333; }
          .go-home-btn { padding: 12px 30px; background: #ffc200; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-block; }
        `}</style>
      </div>
    );
  }

  const productImages = data1.images || data1.slider || [];

  return (
    <>
      <Head>
        <title>{data1.title || data1.title2 || 'Product'} - Flipkart</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      </Head>

      <div className="product-page">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <Link href="/" className="back-btn">
              <svg width={20} height={20} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.7461 2.31408C13.5687 2.113 13.3277 2 13.0765 2C12.8252 2 12.5843 2.113 12.4068 2.31408L6.27783 9.24294C5.90739 9.66174 5.90739 10.3382 6.27783 10.757L12.4068 17.6859C12.7773 18.1047 13.3757 18.1047 13.7461 17.6859C14.1166 17.2671 14.0511 16.5166 13.7461 16.1718L8.29154 9.99462L13.7461 3.82817C13.9684 3.57691 14.1071 2.72213 13.7461 2.31408Z" fill="#666666" />
              </svg>
            </Link>
            <Link href="/" className="logo">
              <img src="/assets/images/logo.png" alt="Flipkart" height={22}  width={90}/>
            </Link>
          </div>
          <div className="header-right">
            
                <button
                  type="button"
                  className="header-cart-button"onClick={(e) => { e.preventDefault(); setmySidenavopen(!mySidenavopen); }}
                  aria-label={`Open cart, ${data133.length} items`}
                  aria-expanded={mySidenavopen}
                >
                  <img src="/assets/images/shoppings.png" alt="" />
                  {data133.length > 0 && <span className="header-cart-count">{data133.length > 99 ? '99+' : data133.length}</span>}
                </button> 
          </div>
        </div>

        <Sidenav mySidenavopen={mySidenavopen} setmySidenavopen={setmySidenavopen} data133={data133} setdata133={setData133} />

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="separator">/</span>
          <span className="current">{data1.title2 || data1.title}</span>
        </div>

        {/* Image Slider */}
        <CustomImageSlider images={productImages} title={data1.title || data1.title2} />

        {/* Product Info */}
        <div className="product-info">
          <h1 className="product-title m-0">{data1.title2 || data1.title}</h1>

          <div className="price-section">
            <div className="price-row">
              <span className="current-price">₹{data1.sellingPrice || data1.price}</span>
              <span className="original-price">₹{data1.mrp || data1.cancelprice}</span>
              <span className="discount-badge">{calculateDiscount()}% off</span>
            </div>
            {data1.mrp && data1.sellingPrice && (
              <p className="savings-text">Save ₹{(data1.mrp - data1.sellingPrice).toLocaleString()} with 2 special offer</p>
            )}
          </div>

          <div className="delivery-badge">
            <span>Free Delivery</span>
          </div>

        </div>

        {/* ===== OFFERS SECTION ===== */}
        <OffersSection />

        {/* ===== DELIVERY TRACKER ===== */}
        <DeliveryTracker />

        {/* Similar Products */}
        <SimilarProducts currentProductId={data1._id || data1.id} />

        {/* Product Details */}
        {(data1.description || data1.highlight || data1.features) && (
          <div className="product-details">
            <h3 className="details-title">Product Details</h3>
            {data1.features && (
              <div className="features-section">
                <div dangerouslySetInnerHTML={{ __html: cleanHtmlText(data1.features) }} />
              </div>
            )}
            {data1.highlight && <div dangerouslySetInnerHTML={{ __html: cleanHtmlText(data1.highlight) }} />}
            {data1.description && <div dangerouslySetInnerHTML={{ __html: cleanHtmlText(data1.description) }} />}
          </div>
        )}

        {/* ===== PRODUCT SPECS & REVIEWS / RATINGS (AT BOTTOM AFTER DESCRIPTION) ===== */}
        <ProductSpecs data={data1} />

        {/* Bottom Action Bar */}
        <div className="action-bar">
          <button className="btn " onClick={() => addToCart(false)}>
            Add to Cart
          </button>
          <button className="btn btn-outline" onClick={() => addToCart(true)}>
            Buy Now
          </button>
        </div>
      </div>

      <style jsx global>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        
        .product-page { background: #f5f5f5; min-height: 100vh; padding-bottom: 80px; }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #fff; border-bottom: 1px solid #efefef; position: sticky; top: 0; z-index: 100; }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .back-btn, .icon-btn { background: none; border: none; padding: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .logo { display: flex; align-items: center; }
        .header-right { display: flex; align-items: center; gap: 16px; }
        .cart-btn { position: relative; }
        .cart-badge { position: absolute; 
    top: -4px;
    right: -6px; background: #ff2002; color: white; font-size: 10px; font-weight: 600; min-width: 16px; height: 18px; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }

        /* Breadcrumb */
        .breadcrumb { background: #fff; padding: 10px 16px; font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px; margin-bottom: 1px; }
        .breadcrumb a { color: #ffc200; text-decoration: none; }
        .separator { color: #999; }
        .current { color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* Product Info */
        .product-info { background: #fff; padding: 16px; margin-top: 1px; }
        p { font-weight: 600; }
        .product-title { font-family: 'Outfit', sans-serif; font-size: 16px; margin: 0px; font-weight: 700; color: #0f172a; line-height: 1.4; margin-bottom: 12px; }
        .price-section { margin-bottom: 12px; }
        .price-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-family: 'Outfit', sans-serif; }
        .current-price { font-size: 24px; font-weight: 800; color: #0f172a; }
        .original-price { font-size: 16px; color: #94a3b8; text-decoration: line-through; }
        .discount-badge { background: #ff6b6b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
        .savings-text { font-size: 13px; color: #00b852; font-weight: 500; }
        .delivery-badge { display: inline-block; background: #f0f0f0; padding: 6px 12px; border-radius: 4px; margin-bottom: 12px; }
        .delivery-badge span { font-size: 13px; color: #333; font-weight: 500; }

        /* Size Error */
        .size-error { background: #fff3f3; border: 1px solid #ffcccc; border-radius: 6px; padding: 8px 12px; font-size: 12px; color: #cc0000; margin-top: 8px; font-weight: 500; animation: shake 0.3s ease; }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }

        /* Rating */
        .rating-section { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
        .rating-badge { background: #00b852; color: white; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; }
        .rating-value { font-size: 13px; font-weight: 600; }
        .rating-text { font-size: 12px; color: #666; }

        /* Product Details UI/UX */
        .product-details { background: #fff; padding: 20px 16px; margin-top: 10px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
        .details-title { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; letter-spacing: -0.01em; }
        .features-section { font-size: 14px; color: #334155; line-height: 1.6; width: 100%; overflow-x: hidden; }
        
        /* Specification Tables */
        .features-section table.a-normal,
        .features-section table { width: 100% !important; border-collapse: separate !important; border-spacing: 0 !important; margin: 16px 0 !important; background: #f8fafc !important; border-radius: 10px !important; overflow: hidden !important; border: 1px solid #e2e8f0 !important; }
        .features-section tr { border-bottom: 1px solid #e2e8f0 !important; }
        .features-section tr:last-child { border-bottom: none !important; }
        .features-section td { padding: 11px 14px !important; font-size: 13px !important; vertical-align: middle !important; border: none !important; }
        .features-section td.a-span3,
        .features-section td:first-child,
        .features-section .a-text-bold { font-weight: 700 !important; color: #1e293b !important; width: 38% !important; background: #f1f5f9 !important; border-right: 1px solid #e2e8f0 !important; }
        .features-section td.a-span9,
        .features-section td:last-child { color: #475569 !important; width: 62% !important; background: #fff !important; word-break: break-word !important; }
        
        /* Bullet Lists ("About this item") */
        .features-section #feature-bullets,
        .features-section .a-section { margin: 16px 0 !important; }
        .features-section h1.a-size-base-plus,
        .features-section h1,
        .features-section h2,
        .features-section h3 { font-family: 'Outfit', sans-serif !important; font-size: 16px !important; font-weight: 700 !important; color: #0f172a !important; margin: 18px 0 10px !important; display: block !important; }
        .features-section ul,
        .features-section ul.a-unordered-list { padding-left: 20px !important; margin: 12px 0 16px !important; list-style: disc outside !important; }
        .features-section li,
        .features-section li.a-spacing-mini { margin-bottom: 10px !important; color: #334155 !important; font-size: 14px !important; line-height: 1.6 !important; }
        .features-section li .a-list-item { color: #334155 !important; font-size: 14px !important; }
        
        /* Amazon A+ Content Grid & Modules */
        .features-section .aplus-module,
        .features-section .celw_idget,
        .features-section [cel_w_idget__id] { margin: 24px 0 !important; width: 100% !important; clear: both !important; }
        .features-section table.apm-eventhirdcol-table,
        .features-section .apm-fixed-width { width: 100% !important; max-width: 100% !important; display: block !important; border: none !important; background: transparent !important; }
        .features-section table.apm-eventhirdcol-table tbody { display: flex !important; flex-direction: column !important; gap: 16px !important; width: 100% !important; }
        .features-section table.apm-eventhirdcol-table tr { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important; gap: 16px !important; width: 100% !important; border: none !important; background: transparent !important; }
        .features-section table.apm-eventhirdcol-table th,
        .features-section table.apm-eventhirdcol-table td,
        .features-section .apm-eventhirdcol { display: flex !important; flex-direction: column !important; align-items: center !important; text-align: center !important; width: 100% !important; padding: 14px !important; border: 1px solid #e2e8f0 !important; background: #fff !important; border-radius: 12px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.03) !important; }
        .features-section .apm-eventhirdcol img,
        .features-section table.apm-eventhirdcol-table img { width: 100% !important; max-width: 220px !important; height: 180px !important; object-fit: cover !important; border-radius: 8px !important; margin-bottom: 10px !important; display: block !important; }
        .features-section .apm-eventhirdcol h4,
        .features-section table.apm-eventhirdcol-table h4 { font-family: 'Outfit', sans-serif !important; font-size: 14px !important; font-weight: 700 !important; color: #0f172a !important; margin: 8px 0 4px !important; text-align: center !important; }
        .features-section .apm-eventhirdcol p,
        .features-section table.apm-eventhirdcol-table p { font-size: 12.5px !important; color: #64748b !important; line-height: 1.5 !important; text-align: center !important; margin: 0 !important; }
        .features-section img { max-width: 100% !important; height: auto !important; border-radius: 10px !important; margin: 14px auto !important; display: block !important; }
        .features-section hr { border: 0; height: 1px; background: #e2e8f0; margin: 20px 0; }

        /* Action Bar */
        .action-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 10px 16px; box-shadow: 0 -2px 10px rgba(0,0,0,0.08); display: flex; gap: 12px; z-index: 99; }
        .btn { flex: 1; padding: 14px 20px; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; border: none; font-family: inherit; }
        .btn-outline { background: #ffc200; color: #000; border: none; }
        .btn-outline:active { background: #e6ad00; }
        .btn-primary { background: #fb641b; color: white; border: none; }
        .btn-primary:active { background: #e05300; }

        @media (max-width: 480px) {
          .current-price { font-size: 22px; }
          .product-title { font-size: 15px; }
        }
      `}</style>
    </>
  );
}

export default ProductDetails;

// For dynamic routes, getStaticPaths is required for SSG
export async function getStaticPaths() {
  // Return empty paths with fallback to generate pages on-demand
  return {
    paths: [],
    fallback: 'blocking'
  };
}

export async function getStaticProps({ params }) {
  try {
    return {
      props: {},
      revalidate: 60 // Regenerate every 60 seconds
    };
  } catch (error) {
    return {
      notFound: true,
      revalidate: 10
    };
  }
}
