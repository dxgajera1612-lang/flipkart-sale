import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { trackPurchase } from "../utils/facebookPixel";

const Ordersummary = () => {
    const router = useRouter();
    const { order_id } = router.query;

    const [user13, setuser13] = useState({});
    const [data, setdata] = useState({});
    const [cart, setCart] = useState([]);
    const [lastOrder, setLastOrder] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [tracked, setTracked] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            setuser13(JSON.parse(localStorage.getItem("user")) || {});
            
            const storedData = JSON.parse(localStorage.getItem("data") || "null");
            if (storedData) setdata(storedData);

            const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
            if (storedCart.length > 0) {
                setCart(storedCart);
            } else if (storedData && (storedData.title || storedData.title2)) {
                setCart([storedData]);
            }

            setLastOrder(JSON.parse(localStorage.getItem("lastOrder")) || null);
        }
    }, [order_id]);

    // Dynamic calculations from cart
    const totalSellingPrice = cart.reduce((s, p) => {
        const itemPrice = Number(p.selling_price || p.sellingPrice || p.price || 0);
        const qty = Number(p.quantity || 1);
        return s + (itemPrice * qty);
    }, 0);

    const totalMrp = cart.reduce((s, p) => {
        const rawMrp = Number(p.mrp || p.cancelprice || p.price || 0);
        const sellPrice = Number(p.selling_price || p.sellingPrice || p.price || 0);
        const itemMrp = rawMrp > sellPrice ? rawMrp : Math.round(sellPrice * 1.5);
        const qty = Number(p.quantity || 1);
        return s + (itemMrp * qty);
    }, 0);

    const totalDiscount = Math.max(0, totalMrp - totalSellingPrice);
    const itemCount = cart.reduce((s, p) => s + Number(p.quantity || 1), 0);

    useEffect(() => {
        if (!mounted) return;
        const currentId = order_id || (typeof window !== 'undefined' ? localStorage.getItem("currentOrderId") : null) || 'ORDER' + Date.now();
        const purchaseKey = `fb_purchase_tracked_${currentId}`;
        
        if ((lastOrder || cart.length > 0) && !tracked && !sessionStorage.getItem(purchaseKey)) {
            trackPurchase({
                orderId: currentId,
                items: lastOrder?.items || cart,
                totalValue: lastOrder?.total || totalSellingPrice || 0,
                currency: 'INR'
            });
            sessionStorage.setItem(purchaseKey, 'true');
            setTracked(true);
        }
    }, [mounted, order_id, lastOrder, cart, totalSellingPrice, tracked]);

    if (!mounted) return null;

    // ── RENDER SUCCESS MODE ──
    if (order_id) {
        const orderIdDisplay = order_id;
        const shippingName = lastOrder?.shippingAddress?.name || user13?.name || "Customer";
        const shippingPhone = lastOrder?.shippingAddress?.phone || user13?.phone || "";
        const shippingAddress = lastOrder?.shippingAddress?.address || user13?.address || "Address details saved";
        const orderTotal = lastOrder?.total || totalSellingPrice || 0;
        const orderItems = lastOrder?.items || cart;

        return (
            <>
                <Head>
                    <title>Order Confirmed! – Flipkart Shopping</title>
                    <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"/>
                    <meta name="theme-color" content="#10b981"/>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
                </Head>

                <style jsx global>{`
                    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                    html, body {
                        font-family: 'Inter', sans-serif;
                        background: #f8fafc;
                        color: #1e293b;
                        -webkit-tap-highlight-color: transparent;
                    }
                    .success-page {
                        background: #f8fafc;
                        min-height: 100vh;
                        max-width: 600px;
                        margin: 0 auto;
                        box-shadow: 0 0 20px rgba(0,0,0,0.03);
                        padding: 20px 16px 120px;
                    }
                    
                    /* Success Card */
                    .success-card {
                        background: #fff;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 32px 20px;
                        text-align: center;
                        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -2px rgba(0,0,0,0.01);
                        margin-bottom: 20px;
                    }
                    .success-icon-wrap {
                        display: flex;
                        justify-content: center;
                        margin-bottom: 16px;
                    }
                    .success-circle {
                        width: 64px;
                        height: 64px;
                        background: #d1fae5;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #10b981;
                        animation: scaleUp 0.3s ease-out;
                    }
                    @keyframes scaleUp {
                        0% { transform: scale(0.8); opacity: 0; }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    .success-title {
                        font-family: 'Outfit', sans-serif;
                        font-size: 22px;
                        font-weight: 800;
                        color: #0f172a;
                        margin-bottom: 8px;
                    }
                    .success-subtitle {
                        font-size: 13px;
                        color: #64748b;
                        line-height: 1.5;
                        margin-bottom: 24px;
                        padding: 0 10px;
                    }
                    .order-tag {
                        display: inline-block;
                        background: #f1f5f9;
                        border-radius: 20px;
                        padding: 6px 16px;
                        font-size: 13px;
                        font-weight: 700;
                        color: #334155;
                    }

                    /* Summary Boxes */
                    .section-card {
                        background: #fff;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 16px;
                        margin-bottom: 16px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.01);
                    }
                    .card-title {
                        font-family: 'Outfit', sans-serif;
                        font-size: 14px;
                        font-weight: 700;
                        color: #0f172a;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        margin-bottom: 12px;
                        border-bottom: 1px solid #f1f5f9;
                        padding-bottom: 6px;
                    }
                    .address-block {
                        font-size: 13px;
                        color: #475569;
                        line-height: 1.6;
                    }
                    .address-name {
                        font-weight: 700;
                        color: #0f172a;
                        margin-bottom: 4px;
                    }

                    /* Product Row */
                    .product-row {
                        display: flex;
                        gap: 12px;
                        align-items: center;
                        padding: 8px 0;
                    }
                    .product-img {
                        width: 50px;
                        height: 50px;
                        border-radius: 6px;
                        object-fit: cover;
                        background: #f1f5f9;
                    }
                    .product-details {
                        flex: 1;
                    }
                    .product-name {
                        font-size: 13px;
                        font-weight: 600;
                        color: #0f172a;
                        margin-bottom: 4px;
                    }
                    .product-price-info {
                        font-size: 12px;
                        color: #64748b;
                        font-weight: 500;
                    }

                    /* Price summary */
                    .price-line {
                        display: flex;
                        justify-content: space-between;
                        font-size: 13px;
                        color: #475569;
                        padding: 6px 0;
                    }
                    .price-line.total {
                        font-size: 15px;
                        font-weight: 700;
                        color: #0f172a;
                        border-top: 1px dashed #e2e8f0;
                        margin-top: 8px;
                        padding-top: 10px;
                    }
                    .price-success {
                        color: #10b981;
                        font-weight: 600;
                    }

                    /* Footer CTA */
                    .success-footer {
                        position: fixed;
                        bottom: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 100%;
                        max-width: 600px;
                        background: #fff;
                        padding: 16px;
                        border-top: 1px solid #e2e8f0;
                        z-index: 10;
                    }
                    .continue-btn {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 100%;
                        height: 48px;
                        background: #0f172a;
                        color: #fff;
                        border: none;
                        border-radius: 8px;
                        font-size: 15px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: background-color 0.2s;
                        font-family: inherit;
                    }
                    .continue-btn:hover { background-color: #1e293b; }
                `}</style>

                <div className="success-page">
                    {/* Success Message Card */}
                    <div className="success-card">
                        <div className="success-icon-wrap">
                            <div className="success-circle">
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        </div>
                        <h2 className="success-title">Order Confirmed!</h2>
                        <p className="success-subtitle">
                            Your payment has been successfully verified. Thank you for placing your order! Your shipment will be dispatched shortly.
                        </p>
                        <span className="order-tag">Order ID: #{orderIdDisplay}</span>
                    </div>

                    {/* Shipping Address Summary */}
                    <div className="section-card">
                        <h3 className="card-title">Delivery Address</h3>
                        <div className="address-block">
                            <p className="address-name">{shippingName}</p>
                            <p>{shippingAddress}</p>
                            <p style={{marginTop: 6, fontWeight: 500}}>Mobile: {shippingPhone}</p>
                        </div>
                    </div>

                    {/* Items Purchased */}
                    {orderItems.length > 0 && (
                        <div className="section-card">
                            <h3 className="card-title">Items</h3>
                            {orderItems.map((item, idx) => (
                                <div key={idx} className="product-row">
                                    <img
                                        src={item.images0 || item.image || item.mainImage || "/uploads/placeholder.png"}
                                        alt="product image"
                                        className="product-img"
                                        onError={(e) => { e.target.src = "/uploads/placeholder.png"; }}
                                    />
                                    <div className="product-details">
                                        <p className="product-name">{item.title2 || item.title || "Product"}</p>
                                        <p className="product-price-info">
                                            Qty: {item.quantity || 1} &middot; Price: ₹{item.selling_price || item.sellingPrice || item.price || 0}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Price Details Summary */}
                    <div className="section-card">
                        <h3 className="card-title">Price Details</h3>
                        <div className="price-line">
                            <span>Delivery Charges</span>
                            <span className="price-success">FREE</span>
                        </div>
                        <div className="price-line">
                            <span>Payment Mode</span>
                            <span style={{fontWeight:600}}>{lastOrder?.paymentMethod || "UPI Online"}</span>
                        </div>
                        <div className="price-line total">
                            <span>Total Paid</span>
                            <span>₹{orderTotal}</span>
                        </div>
                    </div>

                    {/* Sticky Footer */}
                    <div className="success-footer">
                        <button className="continue-btn" onClick={() => router.push("/")}>
                            CONTINUE SHOPPING
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ── RENDER REVIEW MODE ──
    return (
        <>
            <Head>
                <title>Order Summary – Step 2 of 3</title>
                <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"/>
                <meta name="theme-color" content="#ffffff"/>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
            </Head>

            <style jsx global>{`
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
                html, body {
                    font-family: 'Inter', sans-serif;
                    background: #f8fafc;
                    color: #1e293b;
                    -webkit-tap-highlight-color: transparent;
                }
                .summary-page {
                    background: #f8fafc;
                    min-height: 100vh;
                    max-width: 600px;
                    margin: 0 auto;
                    box-shadow: 0 0 20px rgba(0,0,0,0.03);
                    padding: 0 0 120px;
                }

                /* Header */
                .hdr {
                    background: #fff;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .hdr-back {
                    background: none; border: none; cursor: pointer;
                    padding: 4px; display: flex; align-items: center;
                    color: #475569;
                }
                .hdr-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 18px;
                    font-weight: 700;
                    color: #0f172a;
                    margin: 0;
                }

                /* Stepper Image block */
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
                .step-circle.done { background: #10b981; border-color: #10b981; color: #fff; }
                .step-circle.active { background: #2874f0; border-color: #2874f0; color: #fff; }
                .step-label { font-size: 10px; margin-top: 4px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
                .step-label.active { color: #0f172a; font-weight: 700; }
                .step-label.done { color: #10b981; font-weight: 700; }
                .step-line { flex: 1; height: 2px; background: #e2e8f0; margin-top: -14px; }
                .step-line.done { background: #10b981; }

                /* Sections */
                .sec-card {
                    background: #fff;
                    border-bottom: 1px solid #e2e8f0;
                    border-top: 1px solid #e2e8f0;
                    padding: 16px;
                    margin-top: 10px;
                }
                .sec-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 14px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 12px;
                }

                .cust-details {
                    font-size: 14px;
                    line-height: 1.6;
                    color: #334155;
                }
                .cust-name {
                    font-weight: 700;
                    color: #0f172a;
                }

                /* Product row */
                .prod-row {
                    display: flex;
                    gap: 14px;
                    align-items: flex-start;
                }
                .prod-img {
                    width: 68px;
                    height: 68px;
                    border-radius: 8px;
                    object-fit: cover;
                    border: 1px solid #e2e8f0;
                }
                .prod-desc {
                    flex: 1;
                }
                .prod-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #0f172a;
                    line-height: 1.4;
                    margin-bottom: 6px;
                }
                .tag-assured {
                    display: inline-block;
                    height: 16px;
                }
                .qty-tag {
                    font-size: 12px;
                    font-weight: 600;
                    background: #f1f5f9;
                    border-radius: 4px;
                    padding: 2px 8px;
                    display: inline-block;
                    margin-top: 6px;
                    color: #475569;
                }

                /* Price summary */
                .price-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    padding: 8px 0;
                    color: #475569;
                }
                .price-item.bold-total {
                    border-top: 1px dashed #e2e8f0;
                    margin-top: 8px;
                    padding-top: 12px;
                    font-size: 15px;
                    font-weight: 700;
                    color: #0f172a;
                }
                .txt-success { color: #16a34a; font-weight: 600; }
                .txt-savings {
                    background: #f0fdf4;
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #16a34a;
                    margin-top: 10px;
                    text-align: center;
                }

                /* Trust banner */
                .trust-banner {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 20px 16px;
                    background: #f8fafc;
                    opacity: 0.8;
                }
                .trust-img {
                    width: 32px;
                    height: auto;
                }
                .trust-txt {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.4;
                    font-weight: 500;
                }

                /* Footer */
                .summary-footer {
                    position: fixed;
                    bottom: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 100%;
                    max-width: 600px;
                    background: #fff;
                    box-shadow: 0 -10px 30px rgba(0,0,0,0.05);
                    padding: 12px 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-top: 1px solid #e2e8f0;
                    z-index: 10;
                }
                .footer-price-wrap {
                    display: flex;
                    flex-direction: column;
                }
                .strike-mrp {
                    font-size: 11px;
                    text-decoration: line-through;
                    color: #94a3b8;
                }
                .selling-price {
                    font-family: 'Outfit', sans-serif;
                    font-size: 20px;
                    font-weight: 800;
                    color: #0f172a;
                }
                .confirm-btn {
                    height: 44px;
                    background: #fb641b;
                    color: #fff;
                    font-weight: 700;
                    padding: 0 28px;
                    border-radius: 8px;
                    border: none;
                    font-size: 14px;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(251, 100, 27, 0.15);
                    transition: background-color 0.2s;
                    font-family: inherit;
                }
                .confirm-btn:hover { background-color: #e05300; }
            `}</style>

            <div className="summary-page">
                {/* Header */}
                <div className="hdr">
                    <button className="hdr-back" onClick={() => router.push("/")}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <h4 className="hdr-title">Order Summary</h4>
                </div>

                {/* Progress Indicators */}
                {/* Progress Stepper */}
                <div className="stepper">
                    <div className="step">
                        <div className="step-circle done">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="step-label done">Cart</span>
                    </div>
                    <div className="step-line done" />
                    <div className="step">
                        <div className="step-circle active">2</div>
                        <span className="step-label active">Address</span>
                    </div>
                    <div className="step-line" />
                    <div className="step">
                        <div className="step-circle">3</div>
                        <span className="step-label">Payment</span>
                    </div>
                </div>

                {/* Delivery Address */}
                <div className="sec-card">
                    <h3 className="sec-title">Delivered to:</h3>
                    <div className="cust-details">
                        <p className="cust-name">{user13?.name || "Customer"}</p>
                        <p style={{margin: "4px 0"}}>{user13?.address}</p>
                        <p style={{fontWeight: 600, marginTop: 6}}>Mobile: {user13?.phone}</p>
                    </div>
                </div>

                {/* Product Detail List */}
                <div className="sec-card">
                    <h3 className="sec-title">Items in Order:</h3>
                    {cart.map((item, idx) => (
                        <div key={idx} className="prod-row" style={{ borderBottom: idx < cart.length - 1 ? '1px solid #f1f5f9' : 'none', paddingBottom: idx < cart.length - 1 ? 12 : 0, marginBottom: idx < cart.length - 1 ? 12 : 0 }}>
                            <img
                                src={item.images0 || item.image || item.mainImage || "/uploads/placeholder.png"}
                                alt="product thumbnail"
                                className="prod-img"
                                onError={(e) => { e.target.src = "/uploads/placeholder.png"; }}
                            />
                            <div className="prod-desc">
                                <p className="prod-title">{item.title2 || item.title || "Product Details"}</p>
                                <img
                                    src="https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-cp-zion/img/fa_62673a.png"
                                    alt="assured tag"
                                    className="tag-assured"
                                    style={{width: 68}}
                                />
                                <div style={{ marginTop: 6 }}>
                                    <span className="qty-tag">Qty: {item.quantity || 1}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Price Calculation details */}
                <div className="sec-card">
                    <h3 className="sec-title">Price Details</h3>
                    <div className="price-item">
                        <span>Price ({itemCount} item{itemCount !== 1 ? 's' : ''})</span>
                        <span>₹ {totalMrp}</span>
                    </div>
                    <div className="price-item">
                        <span>Discount</span>
                        <span className="txt-success">- ₹ {totalDiscount}</span>
                    </div>
                    <div className="price-item">
                        <span>Delivery Charges</span>
                        <span className="txt-success">FREE Delivery</span>
                    </div>
                    <div className="price-item bold-total">
                        <span>Total Amount</span>
                        <span>₹ {totalSellingPrice}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className="txt-savings">
                            You will save ₹ {totalDiscount} on this order
                        </div>
                    )}
                </div>

                {/* Trust and Safety Banner */}
                <div className="trust-banner">
                    <img
                        className="trust-img"
                        src="https://rukminim1.flixcart.com/www/60/70/promos/13/02/2019/9b179a8a-a0e2-497b-bd44-20aa733dc0ec.png?q=90"
                        alt="shield icon"
                        loading="lazy"
                    />
                    <div className="trust-txt">
                        Safe and secure payments. Easy returns. 100% Authentic products.
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="summary-footer">
                    <div className="footer-price-wrap">
                        {totalDiscount > 0 && (
                            <span className="strike-mrp">₹ {totalMrp}</span>
                        )}
                        <span className="selling-price">₹ {totalSellingPrice}</span>
                    </div>
                    <button className="confirm-btn" onClick={() => router.push('/payment')}>
                        CONTINUE TO PAY
                    </button>
                </div>
            </div>
        </>
    );
};

export default Ordersummary;