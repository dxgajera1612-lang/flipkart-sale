import Link from "next/link";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import { trackInitiateCheckout } from "../utils/facebookPixel";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const data = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(data);
    } catch (_) {}
  }, []);

  const updateLocalStorage = (updated) => {
    localStorage.setItem("cart", JSON.stringify(updated));
    setCartItems(updated);
  };

  const removeItem = (id) => {
    const updated = cartItems.filter((item) => (item.id || item._id) !== id);
    updateLocalStorage(updated);
  };

  const decreaseQty = (id) => {
    const updated = cartItems.map((item) => {
      const itemId = item.id || item._id;
      if (itemId === id && (item.quantity || 1) > 1) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    });
    updateLocalStorage(updated);
  };

  const increaseQty = (id) => {
    const updated = cartItems.map((item) => {
      const itemId = item.id || item._id;
      if (itemId === id) {
        return { ...item, quantity: (item.quantity || 1) + 1 };
      }
      return item;
    });
    updateLocalStorage(updated);
  };

  const totalMrp = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.sellingPrice || item.selling_price || item.price || 0);
    const qty = parseInt(item.quantity || 1);
    return sum + Math.round(price * qty);
  }, 0);

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>CART - Order Summary</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f8fafc; font-family: 'Inter', -apple-system, sans-serif; }

        .cart-page {
          background: #f8fafc; min-height: 100vh;
          max-width: 600px; margin: 0 auto;
          box-shadow: 0 0 20px rgba(0,0,0,0.03);
          padding-bottom: 100px;
        }

        /* Header */
        .cart-header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border-bottom: 1px solid #e2e8f0;
          position: sticky; top: 0; background: #fff; z-index: 10;
        }
        .cart-header h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;
          text-transform: uppercase; letter-spacing: 0.02em;
        }
        .back-btn { display: flex; align-items: center; text-decoration: none; color: #475569; }

        /* Stepper */
        .stepper {
          display: flex; justify-content: center; align-items: center;
          gap: 0; padding: 14px 16px; border-bottom: 1px solid #e2e8f0;
          background: #fff;
        }
        .step { display: flex; flex-direction: column; align-items: center; flex: 1; }
        .step-circle {
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; border: 2px solid #e2e8f0;
          background: #fff; color: #94a3b8; z-index: 1; position: relative;
        }
        .step-circle.active { background: #2874f0; border-color: #2874f0; color: #fff; }
        .step-label { font-size: 10px; margin-top: 4px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
        .step-label.active { color: #2874f0; font-weight: 700; }
        .step-line { flex: 1; height: 2px; background: #e2e8f0; margin-top: -14px; }

        /* Content Body */
        .cart-body { padding: 16px; }
        .cart-card {
          background: #fff; border-radius: 12px;
          border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.02);
          padding: 16px; margin-bottom: 16px;
        }

        /* Cart Product Item */
        .cart-item {
          display: flex; gap: 14px; position: relative;
          padding-bottom: 16px; border-bottom: 1px solid #f1f5f9;
          margin-bottom: 16px;
        }
        .cart-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .cart-item-img {
          width: 76px; height: 76px; object-fit: contain;
          border-radius: 8px; background: #fafafa; border: 1px solid #f1f5f9;
        }
        .cart-item-info { flex: 1; }
        .cart-item-title {
          font-size: 14px; font-weight: 600; color: #0f172a;
          margin-bottom: 6px; padding-right: 28px; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .cart-item-prices { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .cart-price-sell { font-size: 16px; font-weight: 800; color: #0f172a; font-family: 'Outfit', sans-serif; }
        .cart-price-mrp { font-size: 13px; color: #94a3b8; text-decoration: line-through; }

        .trash-btn {
          position: absolute; top: 0; right: 0;
          background: none; border: none; cursor: pointer;
          color: #94a3b8; padding: 4px; transition: color 0.2s;
        }
        .trash-btn:hover { color: #ef4444; }

        /* Quantity selector box */
        .qty-box {
          display: inline-flex; align-items: center;
          background: #eff6ff; border-radius: 6px; border: 1px solid #dbeafe;
          height: 30px; overflow: hidden;
        }
        .qty-btn {
          width: 30px; height: 100%; display: flex; align-items: center; justify-content: center;
          background: none; border: none; font-size: 15px; font-weight: 700;
          color: #2874f0; cursor: pointer; transition: background 0.2s;
        }
        .qty-btn:hover { background: #dbeafe; }
        .qty-num { padding: 0 10px; font-size: 13px; font-weight: 700; color: #1e3a8a; }

        /* Summary Breakdown */
        .summary-title { font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
        .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 13.5px; color: #475569; }
        .summary-row.total {
          border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 12px;
          font-size: 16px; font-weight: 800; color: #0f172a; font-family: 'Outfit', sans-serif;
        }
        .summary-free { color: #10b981; font-weight: 700; }
        .summary-dotted { text-decoration: underline dotted #94a3b8; }

        /* Empty Cart State */
        .empty-cart { text-align: center; padding: 40px 20px; }
        .empty-icon { font-size: 48px; margin-bottom: 12px; }
        .empty-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
        .empty-subtitle { font-size: 13px; color: #64748b; margin-bottom: 16px; }
        .shop-now-btn {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 10px 24px; border-radius: 8px; background: #2874f0; color: #fff;
          font-size: 14px; font-weight: 700; text-decoration: none;
        }

        /* Fixed Bottom Bar */
        .cart-bottom-bar {
          position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 600px; background: #fff;
          padding: 12px 16px; border-top: 1px solid #e2e8f0;
          display: flex; justify-content: space-between; align-items: center;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.03); z-index: 100;
        }
        .cart-bottom-total { font-size: 18px; font-weight: 800; color: #0f172a; font-family: 'Outfit', sans-serif; }
        .place-order-btn {
          height: 48px; padding: 0 28px; border: none; border-radius: 8px;
          background: #fb641b; color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer; text-decoration: none; display: flex; align-items: center; justify-content: center;
          font-family: inherit; box-shadow: 0 4px 12px rgba(251,100,27,0.15);
          transition: background-color 0.2s; position: relative; overflow: hidden;
          isolation: isolate; color-scheme: light;
        }
        .place-order-btn:hover { background: #e05300; }
      `}</style>

      <div className="cart-page">
        {/* Header */}
        <div className="cart-header">
          <Link href="/" className="back-btn">
            <svg width={22} height={22} viewBox="0 0 20 20" fill="none">
              <path d="M13.746 2.314a1.5 1.5 0 0 0-2.14 0L5.475 9.243a1.5 1.5 0 0 0 0 2.114l6.131 6.929a1.5 1.5 0 0 0 2.14-2.113L8.29 10l5.456-6.173a1.5 1.5 0 0 0 0-2.113z" fill="#666" />
            </svg>
          </Link>
          <h4>Cart</h4>
          <div style={{ width: 22 }} />
        </div>

        {/* Stepper */}
        <div className="stepper">
          <div className="step">
            <div className="step-circle active">1</div>
            <div className="step-label active">Cart</div>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-circle">2</div>
            <div className="step-label">Address</div>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-circle">3</div>
            <div className="step-label">Payment</div>
          </div>
        </div>

        {/* Cart Body */}
        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="cart-card empty-cart">
              <div className="empty-icon">🛍️</div>
              <div className="empty-title">Your cart is empty</div>
              <div className="empty-subtitle">Add products to your cart to start shopping!</div>
              <Link href="/" className="shop-now-btn">Shop Now</Link>
            </div>
          ) : (
            <>
              {/* Product List Card */}
              <div className="cart-card">
                {cartItems.map((item) => {
                  const itemId = item.id || item._id;
                  const itemPrice = parseFloat(item.sellingPrice || item.selling_price || item.price || 0);
                  const itemMrp = parseFloat(item.mrp || item.cancelprice || itemPrice * 1.5);
                  const itemTitle = item.title2 || item.title || "Product";
                  const itemImg = item.mainImage || (item.images && item.images[0]) || item.image || "/assets/images/placeholder.png";

                  return (
                    <div key={itemId} className="cart-item">
                      <img src={itemImg} alt={itemTitle} className="cart-item-img" />
                      
                      <div className="cart-item-info">
                        <div className="cart-item-title">{itemTitle}</div>

                        <button
                          type="button"
                          className="trash-btn"
                          onClick={() => removeItem(itemId)}
                          title="Remove item"
                        >
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>

                        <div className="cart-item-prices">
                          <span className="cart-price-sell">₹{itemPrice.toLocaleString()}</span>
                          {itemMrp > itemPrice && (
                            <span className="cart-price-mrp">₹{itemMrp.toLocaleString()}</span>
                          )}
                        </div>

                        <div className="qty-box">
                          <button type="button" className="qty-btn" onClick={() => decreaseQty(itemId)}>-</button>
                          <span className="qty-num">{item.quantity || 1}</span>
                          <button type="button" className="qty-btn" onClick={() => increaseQty(itemId)}>+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Summary Breakdown Card */}
              <div className="cart-card">
                <div className="summary-row">
                  <span>Shipping:</span>
                  <span className="summary-free">FREE</span>
                </div>
                <div className="summary-row">
                  <span className="summary-dotted">Total Product Price:</span>
                  <span>₹{totalMrp.toLocaleString()}.00</span>
                </div>
                <div className="summary-row total">
                  <span>Order Total :</span>
                  <span>₹{totalMrp.toLocaleString()}.00</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Fixed Bottom CTA */}
        {cartItems.length > 0 && (
          <div className="cart-bottom-bar">
            <span className="cart-bottom-total">₹{totalMrp.toLocaleString()}.00</span>
            <Link
              href="/address"
              className="place-order-btn"
              onClick={() => trackInitiateCheckout(cartItems, totalMrp)}
            >
              Place Order
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
