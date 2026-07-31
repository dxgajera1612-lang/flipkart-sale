import Link from 'next/link';
import React, { useMemo, useCallback, useEffect } from 'react';

function Sidenav({ mySidenavopen, setmySidenavopen, data133, setdata133 }) {

    const totalMrp = useMemo(() => {
        if (!data133 || !Array.isArray(data133) || data133.length === 0) return 0;
        return data133.reduce((sum, product) => {
            const price = parseFloat(product?.sellingPrice) || 0;
            const quantity = parseInt(product?.quantity) || 1;
            return sum + (price * quantity);
        }, 0);
    }, [data133]);

    const totalDiscount = useMemo(() => {
        if (!data133 || !Array.isArray(data133) || data133.length === 0) return 0;
        return data133.reduce((sum, product) => {
            const mrp = parseFloat(product?.mrp) || 0;
            const sellingPrice = parseFloat(product?.sellingPrice) || 0;
            const quantity = parseInt(product?.quantity) || 1;
            return sum + ((mrp - sellingPrice) * quantity);
        }, 0);
    }, [data133]);

    const originalTotal = useMemo(() => {
        if (!data133 || !Array.isArray(data133) || data133.length === 0) return 0;
        return data133.reduce((sum, product) => {
            const mrp = parseFloat(product?.mrp) || 0;
            const quantity = parseInt(product?.quantity) || 1;
            return sum + (mrp * quantity);
        }, 0);
    }, [data133]);

    const updateCart = useCallback((updatedProducts) => {
        try {
            localStorage.setItem("cart", JSON.stringify(updatedProducts));
            setdata133(updatedProducts);
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    }, [setdata133]);

    const removeItem = useCallback((itemId) => {
        if (!data133) return;
        const updatedProducts = data133.filter(item => item.id !== itemId);
        updateCart(updatedProducts);
    }, [data133, updateCart]);

    const decreaseQuantity = useCallback((itemId) => {
        if (!data133) return;
        const updatedProducts = data133
            .map(item => {
                if (item.id === itemId) {
                    const newQuantity = (item.quantity || 1) - 1;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
                }
                return item;
            })
            .filter(item => item !== null);
        updateCart(updatedProducts);
    }, [data133, updateCart]);

    const increaseQuantity = useCallback((itemId) => {
        if (!data133) return;
        const updatedProducts = data133.map(item => {
            if (item.id === itemId) {
                return { ...item, quantity: (item.quantity || 1) + 1 };
            }
            return item;
        });
        updateCart(updatedProducts);
    }, [data133, updateCart]);

    // ✅ FIXED: sets to false to hide (logic: visible when mySidenavopen=true)
    const closeSidenav = useCallback((e) => {
        e.preventDefault();
        setmySidenavopen(false);
    }, [setmySidenavopen]);

    const formatPrice = (price) => {
        const numPrice = parseFloat(price) || 0;
        return numPrice.toFixed(2);
    };

    const itemCount = data133 && data133.length > 0 ? data133.reduce((sum, item) => sum + (parseInt(item?.quantity) || 1), 0) : 0;

    useEffect(() => {
        if (!mySidenavopen) return undefined;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setmySidenavopen(false);
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [mySidenavopen, setmySidenavopen]);

    return (
        <div>
            {/* Overlay backdrop */}
            {mySidenavopen && (
                <div
                    className="sidenav-overlay"
                    onClick={closeSidenav}
                />
            )}

            <div
                id="mySidenav"
                className="sidenav"
                // ✅ FIXED: visible when mySidenavopen=true
                style={{ right: mySidenavopen ? "0%" : "-100%" }}
            >
                {/* ── Header ── */}
                <div className="sidenav-header">
                    <div className="sidenav-header-left">
                        <h3 className="sidenav-title">Your Cart</h3>
                        {itemCount > 0 && (
                            <span className="item-count-badge">{itemCount} item{itemCount > 1 ? 's' : ''}</span>
                        )}
                    </div>
                    <button
                        className="closebtn"
                        onClick={closeSidenav}
                        aria-label="Close cart"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                <div className="sidenav-divider" />

                {/* ── Cart Items ── */}
                <div className="cart-products-list">
                 {data133 && data133.length > 0 ? (
    data133.map((item, index) => {
        const itemPrice    = parseFloat(item?.sellingPrice) || 0;
        const itemMrp      = parseFloat(item?.mrp) || 0;
        const itemQuantity = parseInt(item?.quantity) || 1;
        const itemTotal    = itemPrice * itemQuantity;
        const hasDiscount  = itemMrp > itemPrice;
        const discountPct  = hasDiscount
            ? Math.round(((itemMrp - itemPrice) / itemMrp) * 100)
            : 0;

        return (
            <div
                key={item.id || `cart-item-${index}`}
                className="cart-product"
                style={{ animationDelay: `${index * 60}ms` }}
            >
                {/* ── Image ── */}
                <div className="cart-product-img">
                    <img
                        src={item.mainImage || '/placeholder.png'}
                        alt={item.title2 || item.title || 'Product'}
                        onError={(e) => { e.target.src = '/placeholder.png'; }}
                    />
                    {hasDiscount && (
                        <span className="img-discount-pill">{discountPct}%<br/>off</span>
                    )}
                </div>

                {/* ── Details ── */}
                <div className="cart-product-details">

                    {/* Row 1 — Title + Remove */}
                    <div className="cart-product-top-row">
                        <p className="cart-product-name">
                            {item.title2 || item.title || 'Untitled Product'}
                        </p>
                        <button
                            className="remove-cart-item-btn"
                            onClick={() => removeItem(item.id)}
                            aria-label="Remove item"
                            title="Remove from cart"
                        >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                            </svg>
                        </button>
                    </div>

                    {/* Pricing */}
                    <div className="cart-product-pricing">
                        <span className="cart-product-price">₹{formatPrice(itemPrice)}</span>
                        {hasDiscount && (
                            <span className="cart-product-mrp">₹{formatPrice(itemMrp)}</span>
                        )}
                        {hasDiscount && (
                            <span className="discount-badge">{discountPct}% off</span>
                        )}
                    </div>

                    {/* Row 4 — Qty + Item Total */}
                    <div className="cart-product-bottom-row">
                        <div className="cart-qty-wrapper">
                            <button
                                className="qty-btn"
                                onClick={() => decreaseQuantity(item.id)}
                                aria-label="Decrease quantity"
                                disabled={itemQuantity <= 1}
                            >−</button>
                            <span className="qty-num">{itemQuantity}</span>
                            <button
                                className="qty-btn"
                                onClick={() => increaseQuantity(item.id)}
                                aria-label="Increase quantity"
                            >+</button>
                        </div>

                        {itemQuantity > 1 && (
                            <span className="cart-item-total">= ₹{formatPrice(itemTotal)}</span>
                        )}
                    </div>

                </div>
            </div>
        );
    })
) : (
    /* ── Empty State ── */
    <div className="cart-empty">
        <div className="cart-empty-icon">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="27" stroke="#d6e4ff" strokeWidth="1.5" strokeDasharray="4 3"/>
                <path d="M14 16h4.5l5 18h13l4.5-13H20" stroke="#2874f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="25" cy="38" r="2" fill="#2874f0"/>
                <circle cx="35" cy="38" r="2" fill="#2874f0"/>
                <path d="M28 10v3M24 11.5l1.5 2.5M32 11.5l-1.5 2.5" stroke="#93b4f0" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
        </div>
        <p className="cart-empty-text">Your cart is empty</p>
        <p className="cart-empty-sub">Browse our collection and add something you love</p>
        <a href="/" className="cart-empty-cta">Shop Now →</a>
    </div>
)}
                </div>
 {/* ── Footer ── */}
{data133 && data133.length > 0 && (
    <div className="cart__footer">

        {/* Price Breakdown */}
        <div className="cart__price__details">
            {totalDiscount > 0 && (
                <div className="price-row">
                    <span className="price-label">Subtotal</span>
                    <span className="price-value strikethrough">₹{formatPrice(originalTotal)}</span>
                </div>
            )}
            {totalDiscount > 0 && (
                <div className="price-row">
                    <span className="price-label">Discount</span>
                    <span className="price-value discount-value">− ₹{formatPrice(totalDiscount)}</span>
                </div>
            )}
            <div className="price-row">
                <span className="price-label">Cart Total</span>
                <span className="price-value">₹{formatPrice(totalMrp)}</span>
            </div>
            <div className="price-row">
                <span className="price-label">Shipping</span>
                <span className="price-value free-value">FREE</span>
            </div>
        </div>

        {/* To Pay + Checkout — combined single bar */}
       <div className="cart__checkout">
      <div className="cart__final__payment">
        <h3 className=" text-left w-100" style={{fontSize:"20px"}}>
          ₹{formatPrice(totalMrp)}
        </h3>
      </div>

      <a href="/cart" className="confirm-order-btn">
        Place Order
      </a>
    </div>
    </div>
)}
            </div>

            <style jsx>{`
                /* ── Design Tokens ── */
                /* Brand:   #ffc200 (purple-pink)        */
                /* Brand BG:#f8eef6                      */
                /* Success: #16a34a (green)              */
                /* Danger:  #dc2626 (red)                */
                /* Text-1:  #111827 (near-black)         */
                /* Text-2:  #4b5563 (medium gray)        */
                /* Text-3:  #9ca3af (light gray)         */
                /* Border:  #e5e7eb                      */
                /* Surface: #f9fafb                      */

                /* ── Overlay ── */
                .sidenav-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    z-index: 999;
                    backdrop-filter: blur(2px);
                    -webkit-backdrop-filter: blur(2px);
                    animation: fadeIn 0.2s ease;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
/* ── Footer ── */
.cart__footer {
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    flex-shrink: 0;
}

/* Price rows — tighter */
.cart__price__details {
    padding: 10px 20px 8px 20px;
    border-bottom: 1px dashed #e5e7eb;
}
.price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;          /* ⬇ was 5px */
}
.price-label {
    font-size: 12px;         /* ⬇ was 13px */
    color: #6b7280;
    font-weight: 400;
}
.price-value {
    font-size: 12px;         /* ⬇ was 13px */
    color: #374151;
    font-weight: 500;
}
.strikethrough {
    text-decoration: line-through;
    color: #9ca3af;
    font-weight: 400;
}
.discount-value { color: #16a34a; font-weight: 600; }
.free-value {
    color: #16a34a;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 0.6px;
}

/* ── Checkout bar — merged To Pay + button ── */
.cart__checkout {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px 14px 20px;  /* ⬇ was 14px 20px 20px */
    gap: 12px;
    background: #fff;
}
.cart__final__payment {
    display: flex;
    flex-direction: column;
    gap: 1px;
}
.topay-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
}
.topay-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
}
.topay-amount {
    font-size: 20px;
    font-weight: 800;
    color: #ffc200;
    letter-spacing: -0.5px;
    line-height: 1;
}
.tax-note {
    font-size: 10px;
    color: #9ca3af;
    margin: 0;
}
.confirm-order-btn {
    background: #fb641b;
    color: #fff;
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 700;
    padding: 11px 18px;     /* ⬇ was 13px 22px */
    border-radius: 10px;
    white-space: nowrap;
    box-shadow: 0 4px 14px rgba(251, 100, 27, 0.35);
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
}
.confirm-order-btn:hover {
    background: #e05300;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(251, 100, 27, 0.45);
    color: #fff;
    text-decoration: none;
}
                /* ── Sidenav Shell ── */
                .sidenav {
                    position: fixed;
                    top: 0;
                    height: 100%;
                    width: 380px;
                    max-width: 100vw;
                    background: #ffffff;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: -8px 0 32px rgba(0,0,0,0.12);
                }

                /* ── Header ── */
                .sidenav-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 20px 16px 20px;
                    background: #fff;
                }
                .sidenav-header-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .sidenav-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #ffc200;
                    margin: 0;
                    letter-spacing: -0.3px;
                }
                .item-count-badge {
                    background: #f8eef6;
                    color: #ffc200;
                    font-size: 11px;
                    font-weight: 600;
                    padding: 3px 9px;
                    border-radius: 20px;
                    letter-spacing: 0.2px;
                    border: 1px solid #e9cfe5;
                }
                .closebtn {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    cursor: pointer;
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #4b5563;
                    transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
                    flex-shrink: 0;
                }
                .closebtn:hover {
                    background: #f8eef6;
                    color: #ffc200;
                    border-color: #e9cfe5;
                    transform: rotate(90deg);
                }

                /* ── Divider ── */
                .sidenav-divider {
                    height: 1px;
                    background: #e5e7eb;
                    margin: 0;
                    flex-shrink: 0;
                }

                /* ── Cart Items List ── */
                .cart-products-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 0;
                    scroll-behavior: smooth;
                }
                .cart-products-list::-webkit-scrollbar { width: 4px; }
                .cart-products-list::-webkit-scrollbar-track { background: transparent; }
                .cart-products-list::-webkit-scrollbar-thumb { background: #e9cfe5; border-radius: 4px; }

                /* ── Cart Product Card ── */
                .cart-product {
                    display: flex;
                    gap: 14px;
                    padding: 14px 20px;
                    border-bottom: 1px solid #f3f4f6;
                    transition: background 0.15s;
                }
                .cart-product:hover { background: #fdf8fc; }

                /* Product Image */
                .cart-product-img {
                    width: 80px;
                    height: 90px;
                    border-radius: 10px;
                    overflow: hidden;
                    flex-shrink: 0;
                    background: #f3f4f6;
                    border: 1px solid #e5e7eb;
                }
                .cart-product-img img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                /* Product Details Column */
                .cart-product-details {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                /* Title + Remove Row */
                .cart-product-top-row {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 8px;
                }
                .cart-product-name {
                    font-size: 13.5px;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                    line-height: 1.45;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .remove-cart-item-btn {
                    background: none;
                    border: none;
                    padding: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #9ca3af;
                    border-radius: 4px;
                    transition: color 0.2s, background 0.2s;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                .remove-cart-item-btn:hover {
                    color: #dc2626;
                    background: #fef2f2;
                }

                /* Meta (size) */
                .cart-product-meta {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .size-badge {
                    font-size: 11.5px;
                    color: #4b5563;
                    background: #f3f4f6;
                    border: 1px solid #d1d5db;
                    padding: 2px 8px;
                    border-radius: 5px;
                    letter-spacing: 0.2px;
                }
                .size-badge strong {
                    color: #111827;
                    font-weight: 700;
                }

                /* Pricing Row */
                .cart-product-pricing {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    flex-wrap: wrap;
                }
                .cart-product-price {
                    font-size: 14px;
                    font-weight: 700;
                    color: #111827;
                    margin: 0;
                }
                .cart-product-mrp {
                    font-size: 12px;
                    text-decoration: line-through;
                    color: #9ca3af;
                    font-weight: 400;
                }
                .discount-badge {
                    font-size: 10.5px;
                    font-weight: 700;
                    color: #16a34a;
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    padding: 1px 6px;
                    border-radius: 4px;
                    letter-spacing: 0.2px;
                }

                /* Qty + Item Total Row */
                .cart-product-bottom-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-top: 2px;
                }
                .cart-qty-wrapper {
                    display: flex;
                    align-items: center;
                    border: 1.5px solid #d1d5db;
                    border-radius: 8px;
                    overflow: hidden;
                    height: 30px;
                }
                .qty-btn {
                    background: #f9fafb;
                    border: none;
                    width: 28px;
                    height: 100%;
                    font-size: 15px;
                    cursor: pointer;
                    color: #374151;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.15s, color 0.15s;
                    line-height: 1;
                }
                .qty-btn:hover:not(:disabled) {
                    background: #f8eef6;
                    color: #ffc200;
                }
                .qty-btn:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                    background: #f9fafb;
                    color: #9ca3af;
                }
                .qty-num {
                    font-size: 13px;
                    font-weight: 700;
                    color: #111827;
                    min-width: 26px;
                    text-align: center;
                    border-left: 1.5px solid #d1d5db;
                    border-right: 1.5px solid #d1d5db;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #fff;
                }
                .cart-item-total {
                    font-size: 12.5px;
                    font-weight: 600;
                    color: #4b5563;
                }

                /* ── Empty State ── */
                .cart-empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    gap: 10px;
                }
                .cart-empty-icon { opacity: 0.4; }
                .cart-empty-text {
                    font-size: 15px;
                    font-weight: 600;
                    color: #374151;
                    margin: 0;
                }
                .cart-empty-sub {
                    font-size: 13px;
                    color: #9ca3af;
                    margin: 0;
                }

                /* ── Footer ── */
                .cart__footer {
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                    padding: 0;
                    flex-shrink: 0;
                }
                .cart__price__details {
                    padding: 14px 20px 10px 20px;
                }

                /* Price Rows */
                .price-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 5px 0;
                }
                .price-label {
                    font-size: 13px;
                    color: #6b7280;
                    font-weight: 400;
                }
                .price-value {
                    font-size: 13px;
                    color: #374151;
                    font-weight: 500;
                }
                .strikethrough {
                    text-decoration: line-through;
                    color: #9ca3af;
                    font-weight: 400;
                }
                .discount-value {
                    color: #16a34a;
                    font-weight: 600;
                }
                .free-value {
                    color: #16a34a;
                    font-weight: 700;
                    font-size: 12px;
                    letter-spacing: 0.6px;
                }

                /* Total Row */
                .total-row {
                    padding: 8px 0 2px;
                }
                .total-label {
                    font-size: 15px;
                    font-weight: 700;
                    color: #111827;
                }
                .total-value {
                    font-size: 18px;
                    font-weight: 800;
                    color: #ffc200;
                    letter-spacing: -0.4px;
                }

                /* ── Checkout Bar ── */
                .cart__checkout {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 20px 20px 20px;
                    gap: 12px;
                    background: #fff;
                    border-top: 1px solid #e5e7eb;
                }
                .cart__final__payment {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .final-amount {
                    font-size: 18px;
                    font-weight: 800;
                    color: #111827;
                    margin: 0;
                    letter-spacing: -0.5px;
                }
                .tax-note {
                    font-size: 10.5px;
                    color: #9ca3af;
                    margin: 0;
                }
                .confirm-order-btn {
                    background: #fb641b;
                    color: #fff;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 700;
                    padding: 13px 22px;
                    border-radius: 12px;
                    letter-spacing: 0.2px;
                    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
                    white-space: nowrap;
                    box-shadow: 0 4px 14px rgba(251, 100, 27, 0.35);
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .confirm-order-btn:hover {
                    background: #e05300;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(251, 100, 27, 0.45);
                    color: #fff;
                    text-decoration: none;
                }
                .confirm-order-btn:active {
                    transform: translateY(0);
                    box-shadow: 0 2px 8px rgba(251, 100, 27, 0.2);
                }
            `}</style>
        </div>
    );
}

export default Sidenav;
