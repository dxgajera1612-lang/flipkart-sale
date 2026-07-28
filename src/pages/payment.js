import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Head from "next/head";
import { trackAddPaymentInfo } from "../utils/facebookPixel";

/* ── load Cashfree JS SDK ── */
function loadCashfreeSDK() {
    return new Promise((resolve) => {
        if (typeof window === "undefined") return resolve(false);
        if (window.Cashfree) return resolve(true);
        const existing = document.querySelector('script[src*="cashfree.js"]');
        if (existing) {
            let n = 0;
            const t = setInterval(() => {
                if (window.Cashfree) { clearInterval(t); resolve(true); }
                if (++n > 60) { clearInterval(t); resolve(false); }
            }, 200);
            return;
        }
        const s = document.createElement("script");
        s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        s.async = true;
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        document.head.appendChild(s);
    });
}

export default function Payments() {
    const router = useRouter();

    const [settings,  setSettings]  = useState(null);
    const [products,  setProducts]  = useState({ id:"", Gpay:true, Phonepe:true, Paytm:true, Bhim:true });
    const [cart,      setCart]      = useState([]);
    const [user,      setUser]      = useState({ name:"", phone:"", email:"" });
    const [activeTab, setActiveTab] = useState(null);
    const [payUrl,    setPayUrl]    = useState("");
    const [loading,   setLoading]   = useState(false);
    const [mounted,   setMounted]   = useState(false);
    const [orderId,   setOrderId]   = useState("");
    
    // Discount states
    const [phonePeDiscount, setPhonePeDiscount] = useState(0);
    const [showDiscountBadge, setShowDiscountBadge] = useState(false);
    const [discountPercentage, setDiscountPercentage] = useState(10); // 10% discount for PhonePe

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        try { const c = localStorage.getItem("cart"); if (c) setCart(JSON.parse(c)); } catch(_){}
        try { const u = localStorage.getItem("user"); if (u) setUser(JSON.parse(u)); } catch(_){}

        // Retrieve or generate a clean 6-digit numeric order ID
        let storedOrderId = localStorage.getItem("currentOrderId");
        if (!storedOrderId) {
            storedOrderId = "ORDER" + Math.floor(100000 + Math.random() * 900000);
            localStorage.setItem("currentOrderId", storedOrderId);
        }
        setOrderId(storedOrderId);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res  = await fetch("/api/settings");
                const data = await res.json();
                setSettings(data.data);
                const upi = data.data?.upi || {};
                setProducts(p => ({ ...p, ...upi }));
                
                // Check if PhonePe is enabled and set it as default
                if (upi.Phonepe !== false) {
                    setActiveTab(3);
                    // Apply PhonePe discount
                    const discount = upi.phonePeDiscount || 10; // Default 10% if not set
                    setDiscountPercentage(discount);
                    setShowDiscountBadge(true);
                } else if (upi.Gpay !== false) {
                    setActiveTab(2);
                } else if (upi.Paytm !== false) {
                    setActiveTab(4);
                } else if (upi.Bhim !== false) {
                    setActiveTab(1);
                } else if (data.data?.payment?.cashfreeEnabled) {
                    setActiveTab(6);
                } else {
                    setActiveTab(3);
                }
            } catch { 
                setActiveTab(3);
                setShowDiscountBadge(true);
            }
        })();
    }, []);

    useEffect(() => {
        if (activeTab) {
            const methodNames = {
                1: "BHIM UPI",
                2: "GPay",
                3: "PhonePe",
                4: "Paytm Native",
                6: "Card / Net Banking"
            };
            const cartValue = cart.reduce((s,p) => s + Math.round((p.sellingPrice||0)*(p.quantity||1)), 0);
            trackAddPaymentInfo(methodNames[activeTab] || "UPI", cartValue);
        }
    }, [activeTab, cart]);

    /* totals */
    const baseTotal = cart.reduce((s,p) => s + Math.round((p.sellingPrice||0)*(p.quantity||1)), 0);
    const itemCount = cart.reduce((s,p) => s + (p.quantity||1), 0);
    const crossedMrp = Math.round(baseTotal * 7.17);

    // Calculate PhonePe discount
    const calculatePhonePeDiscount = (amount) => {
        if (activeTab === 3) {
            return Math.round(amount * (discountPercentage / 100));
        }
        return 0;
    };

    const phonePeDiscountAmount = calculatePhonePeDiscount(baseTotal);
    const totalMrp = activeTab === 3 ? baseTotal - phonePeDiscountAmount : baseTotal;
    const savedAmount = activeTab === 3 ? phonePeDiscountAmount : 0;

    /* ── UPI deep-links ── */
    useEffect(() => {
        if (!mounted || !activeTab || !orderId || activeTab === 6) { setPayUrl(""); return; }
        const amt = totalMrp;
        const txn = `TXN${Date.now()}`;

        if (!products?.id) { setPayUrl(""); return; }
        const id = products.id;

        // 1. PhonePe Native with discount
        const ppPayload = {
            p2pPaymentCheckoutParams: {
                checkoutType: "COLLECT",
                initialAmount: amt * 100,
                note: {
                    type: "text",
                    message: orderId
                },
                supportedInstruments: -1
            },
            contact: {
                type: "EXTERNAL_MERCHANT",
                name: "Store Name",
                vpa: id
            }
        };
        const phonePeLink = `phonepe://native?data=${encodeURIComponent(btoa(JSON.stringify(ppPayload)))}&id=p2ppayment`;

        // 2. Google Pay
        const gpayLink = `gpay://pay?pa=${encodeURIComponent(id)}&pn=${encodeURIComponent("Store Name")}&am=${amt}&tr=${txn}&tn=${encodeURIComponent(orderId)}&mc=8931&cu=INR`;

        // 3. Paytm
        const paytmLink = `paytmmp://pay?pa=${encodeURIComponent(id)}&pn=${encodeURIComponent("Store")}&am=${amt}&tr=${txn}&cu=INR&tn=${encodeURIComponent(orderId)}`;

        // 4. BHIM UPI
        const bhimLink = `bhim://pay?pa=${encodeURIComponent(id)}&pn=${encodeURIComponent("Store")}&am=${amt}&tr=${txn}&mc=8931&cu=INR&tn=${encodeURIComponent(orderId)}`;

        const urls = {
            1: bhimLink,
            2: gpayLink,
            3: phonePeLink,
            4: paytmLink,
        };
        setPayUrl(urls[activeTab] || "");
    }, [activeTab, products?.id, totalMrp, mounted, orderId]);

    const handlePay = async () => {
        if (activeTab === 6) {
            setLoading(true);
            try {
                const ready = await loadCashfreeSDK();
                if (!ready || !window.Cashfree) throw new Error("Payment SDK could not load. Please check your internet and try again.");
                const res  = await fetch("/api/payment/cashfree", {
                    method:"POST",
                    headers:{"Content-Type":"application/json"},
                    body: JSON.stringify({ 
                        amount: totalMrp, 
                        orderId, 
                        name: user.name || "Customer", 
                        phone: user.phone || "9999999999", 
                        email: user.email || "customer@example.com" 
                    }),
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.message || "Server error. Please try again.");
                if (!data.payment_session_id)  throw new Error("No payment session received.");
                const cashfree = window.Cashfree({
                    mode: settings?.payment?.cashfreeMode === "production" ? "production" : "sandbox",
                });
                cashfree.checkout({ paymentSessionId: data.payment_session_id, redirectTarget: "_self" });
            } catch(err) {
                console.error("[Cashfree Error]", err);
                if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
                    const confirmBypass = window.confirm(
                        `Payment failed: "${err.message}"\n\nSince you are running on localhost, would you like to bypass the payment gateway and simulate a successful payment for testing?`
                    );
                    if (confirmBypass) {
                        window.location.href = `/ordersummdary?order_id=${orderId}`;
                        return;
                    }
                } else {
                    alert(err.message || "Payment failed. Please try again.");
                }
                setLoading(false);
            }
            return;
        }
        if (payUrl) {
            // Save details to lastOrder
            const orderDetails = {
                orderId,
                items: cart,
                total: totalMrp,
                originalTotal: baseTotal,
                discount: savedAmount,
                discountPercentage: activeTab === 3 ? discountPercentage : 0,
                shippingAddress: user,
                paymentMethod: activeTab === 1 ? "BHIM" : activeTab === 2 ? "GPay" : activeTab === 3 ? "PhonePe" : activeTab === 4 ? "Paytm" : "UPI",
                date: new Date().toISOString(),
            };
            localStorage.setItem("lastOrder", JSON.stringify(orderDetails));

            // Launch the deep link
            window.location.href = payUrl;

            // Wait and redirect to confirmation
            setLoading(true);
            setTimeout(() => {
                router.push(`/confirm-payment?orderId=${orderId}&amount=${totalMrp}&discount=${savedAmount}`);
            }, 1200);
            return;
        }
        alert("Please select a payment method.");
    };

    // Force PhonePe as default and show discount
    const handlePhonePeClick = () => {
        setActiveTab(3);
        setShowDiscountBadge(true);
    };

    // Handle other payment methods - show warning about losing discount
    const handleOtherPaymentClick = (tab) => {
        if (tab !== 3 && showDiscountBadge) {
            const confirmSwitch = window.confirm(
                `⚠️ You will lose ₹${phonePeDiscountAmount} PhonePe discount if you switch payment method.\n\nDo you want to continue?`
            );
            if (!confirmSwitch) {
                return;
            }
        }
        setActiveTab(tab);
        if (tab === 3) {
            setShowDiscountBadge(true);
        } else {
            setShowDiscountBadge(false);
        }
    };

    if (!mounted || activeTab === null) return null;

    const show = {
        phonepe:  products.Phonepe  !== false,
        gpay:     products.Gpay     !== false,
        paytm:    products.Paytm    !== false,
        bhim:     products.Bhim     !== false,
        cashfree: !!settings?.payment?.cashfreeEnabled,
    };

    return (
        <>
            <Head>
                <title>Payments – Step 3 of 3</title>
                <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no"/>
                <meta name="theme-color" content="#ffffff"/>
                <link rel="preconnect" href="https://fonts.googleapis.com"/>
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
            </Head>

            <style jsx global>{`
                *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
                html, body {
                    font-family:'Inter', sans-serif;
                    background:#f8fafc;
                    color:#1e293b;
                    -webkit-tap-highlight-color:transparent;
                }
                .header-menu, nav>ul, footer,
                .cart_page_footer { display:none !important; }

                .pmt-page { background:#f8fafc; min-height:100vh; max-width:600px; margin:0 auto; box-shadow:0 0 20px rgba(0,0,0,0.03); }

                .pmt-header {
                    background:#fff;
                    position:sticky;
                    top:0;
                    z-index:50;
                    border-bottom:1px solid #e2e8f0;
                    padding:12px 16px;
                }
                .pmt-hdr-row {
                    display:flex;
                    align-items:center;
                    width:100%;
                    gap:12px;
                }
                .pmt-back-wrap {
                    display:flex;
                    align-items:center;
                }
                .pmt-back-btn {
                    background:none; border:none; cursor:pointer;
                    padding:4px; display:flex; align-items:center;
                    color:#475569;
                    transition:color 0.2s;
                }
                .pmt-back-btn:hover { color:#0f172a; }
                .pmt-hdr-text { flex:1; }
                .pmt-step {
                    font-size:11px;
                    font-weight:700;
                    text-transform:uppercase;
                    letter-spacing:0.05em;
                    color:#64748b;
                    margin-bottom:2px;
                }
                .pmt-title {
                    font-family:'Outfit', sans-serif;
                    font-size:18px;
                    font-weight:700;
                    color:#0f172a;
                    margin:0;
                    line-height:1.2;
                }
                .pmt-secure {
                    display:flex;
                    align-items:center;
                    background:#f0fdf4;
                    border:1px solid #bbf7d0;
                    border-radius:20px;
                    padding:4px 10px;
                    gap:4px;
                    white-space:nowrap;
                }
                .pmt-secure-txt {
                    font-size:11px;
                    font-weight:600;
                    color:#15803d;
                }

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

                .pmt-body { padding:16px 16px 120px; }

                /* Discount Banner */
                .discount-banner {
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    border: 2px solid #f59e0b;
                    border-radius: 12px;
                    padding: 12px 16px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: pulse-banner 2s infinite;
                }
                @keyframes pulse-banner {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                .discount-banner-icon {
                    font-size: 28px;
                    flex-shrink: 0;
                }
                .discount-banner-text {
                    flex: 1;
                }
                .discount-banner-title {
                    font-weight: 700;
                    color: #92400e;
                    font-size: 15px;
                }
                .discount-banner-sub {
                    font-size: 13px;
                    color: #78350f;
                    margin-top: 2px;
                }
                .discount-banner-amount {
                    background: #92400e;
                    color: #fef3c7;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 18px;
                    white-space: nowrap;
                }

                .upi-section {
                    background:#fff;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                    overflow:hidden;
                    margin-bottom:16px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.02);
                }
                .upi-sec-hdr {
                    padding:16px;
                    border-bottom:1px solid #f1f5f9;
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    background:#fff;
                }
                .upi-sec-hdr-left {
                    display:flex;
                    align-items:center;
                    gap:10px;
                }
                .upi-sec-label {
                    font-family:'Outfit', sans-serif;
                    font-size:16px;
                    font-weight:700;
                    color:#0f172a;
                }

                .upi-opts-card {
                    padding:8px 0;
                    background:#fff;
                }

                .pmt-opt {
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    padding:16px;
                    cursor:pointer;
                    transition:background-color 0.15s, transform 0.15s;
                    border-bottom:1px solid #f1f5f9;
                    position: relative;
                }
                .pmt-opt:last-child { border-bottom:none; }
                .pmt-opt:hover { background-color:#f8fafc; }
                .pmt-opt.active-opt { 
                    background-color:#f1f5f9;
                    border-left: 4px solid var(--theme-color, #5f259f);
                }
                .pmt-opt-left {
                    display:flex;
                    align-items:center;
                    gap:14px;
                    flex:1;
                }
                .pmt-radio-wrap {
                    position:relative;
                    width:20px;
                    height:20px;
                    border-radius:50%;
                    border:2px solid #cbd5e1;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    transition:border-color 0.2s, background-color 0.2s;
                }
                .pmt-radio-wrap.checked {
                    border-color:var(--theme-color, #1a73e8);
                }
                .pmt-radio-inner {
                    width:10px;
                    height:10px;
                    border-radius:50%;
                    background-color:var(--theme-color, #1a73e8);
                    transform:scale(0);
                    transition:transform 0.2s;
                }
                .pmt-radio-wrap.checked .pmt-radio-inner {
                    transform:scale(1);
                }

                .pmt-opt-info {}
                .pmt-opt-top {
                    display:flex;
                    align-items:center;
                    gap:8px;
                    font-size:15px;
                    font-weight:700;
                    color:#0f172a;
                }
                .pmt-pipe { color:#cbd5e1; font-weight:300; }
                .pmt-opt-sub {
                    font-size:12px;
                    margin-top:2px;
                    font-weight:600;
                }
                .sub-phonepe { color:#7c3aed; }
                .sub-gpay    { color:#2563eb; }
                .sub-paytm   { color:#0ea5e9; }
                .sub-bhim    { color:#ea580c; }
                .sub-cashfree{ color:#334155; }

                /* Discount badge on PhonePe option */
                .discount-badge {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 700;
                    margin-left: 6px;
                    animation: pulse-badge 1.5s infinite;
                }
                @keyframes pulse-badge {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .saved-amount {
                    font-size: 12px;
                    color: #059669;
                    font-weight: 600;
                }

                .price-box {
                    background:#fff;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                    padding:16px;
                    margin-bottom:16px;
                    box-shadow:0 1px 3px rgba(0,0,0,0.02);
                }
                .price-box-title {
                    font-family:'Outfit', sans-serif;
                    font-size:15px;
                    font-weight:700;
                    color:#0f172a;
                    margin-bottom:12px;
                }
                .price-row {
                    display:flex;
                    justify-content:space-between;
                    padding:6px 0;
                    font-size:14px;
                    color:#475569;
                }
                .price-free  { color:#16a34a; font-weight:600; }
                .price-strike{ text-decoration:line-through; color:#94a3b8; }
                .price-discount {
                    color: #059669;
                    font-weight: 600;
                }
                .price-total-row {
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    padding-top:12px;
                    margin-top:8px;
                    border-top:1px dashed #e2e8f0;
                }
                .price-total-lbl {
                    font-weight:700;
                    color:#0f172a;
                    font-size:15px;
                }
                .price-total-amt {
                    font-size:18px;
                    font-weight:800;
                    color:#0f172a;
                }
                .price-total-amt.discounted {
                    color: #059669;
                }

                .secure-pay-wrap {
                    display:flex;
                    justify-content:center;
                    padding:8px 0;
                    margin-bottom:20px;
                }
                .secure-pay-img {
                    width:100%;
                    max-width:280px;
                    opacity:0.8;
                }

                .pmt-footer {
                    position:fixed;
                    bottom:0;
                    left:50%;
                    transform:translateX(-50%);
                    width:100%;
                    max-width:600px;
                    background:#fff;
                    box-shadow:0 -10px 30px rgba(0,0,0,0.05);
                    padding:16px;
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    border-top:1px solid #e2e8f0;
                    z-index:50;
                }
                .pmt-footer-left {
                    display:flex;
                    flex-direction:column;
                }
                .pmt-footer-lbl {
                    font-size:11px;
                    font-weight:600;
                    color:#64748b;
                    text-transform:uppercase;
                }
                .pmt-footer-amt {
                    font-family:'Outfit', sans-serif;
                    font-size:22px;
                    font-weight:800;
                    color:#0f172a;
                    line-height:1.2;
                }
                .pmt-footer-amt.discounted {
                    color: #059669;
                }
                .pmt-footer-saved {
                    font-size: 11px;
                    color: #059669;
                    font-weight: 600;
                }
                .pmt-pay-btn {
                    background:#fb641b;
                    color:#fff;
                    font-weight:700;
                    height:48px;
                    padding:0 28px;
                    border-radius:10px;
                    border:none;
                    font-size:14px;
                    cursor:pointer;
                    box-shadow:0 4px 12px rgba(251, 100, 27, 0.2);
                    display:flex;
                    align-items:center;
                    gap:8px;
                    transition:all .15s ease-in-out;
                    font-family:'Inter',sans-serif;
                    letter-spacing:0.02em;
                }
                .pmt-pay-btn:hover:not(:disabled)  { background:#e05300; transform:translateY(-1px); box-shadow:0 6px 16px rgba(251, 100, 27, 0.3); }
                .pmt-pay-btn:active:not(:disabled)  { background:#c84a00; transform:translateY(0); }
                .pmt-pay-btn:disabled               { opacity:.6; cursor:not-allowed; box-shadow:none; }

                .btn-spin {
                    width:16px; height:16px;
                    border:2px solid rgba(0,0,0,.15);
                    border-top-color:#000;
                    border-radius:50%;
                    animation:_bspin .65s linear infinite;
                }
                @keyframes _bspin { to { transform:rotate(360deg); } }
            `}</style>

            <div className="pmt-page">

                {/* ══ STICKY HEADER ══ */}
                <div className="pmt-header">
                    <div className="pmt-hdr-row">
                        <div className="pmt-back-wrap">
                            <button className="pmt-back-btn" onClick={() => router.back()}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                            </button>
                        </div>
                        <div className="pmt-hdr-text">
                            <p className="pmt-step">Step 3 of 3</p>
                            <h5 className="pmt-title">Select Payment Mode</h5>
                        </div>
                        <div className="pmt-secure">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <p className="pmt-secure-txt">100% Secure</p>
                        </div>
                    </div>
                </div>

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
                        <div className="step-circle done">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="step-label done">Address</span>
                    </div>
                    <div className="step-line done" />
                    <div className="step">
                        <div className="step-circle active">3</div>
                        <span className="step-label active">Payment</span>
                    </div>
                </div>

                {/* ══ BODY ══ */}
                <div className="pmt-body">

                    {/* Discount Banner - Only show for PhonePe */}
                    {showDiscountBadge && activeTab === 3 && phonePeDiscountAmount > 0 && (
                        <div className="discount-banner">
                            <div className="discount-banner-icon">🎉</div>
                            <div className="discount-banner-text">
                                <div className="discount-banner-title">
                                    PhonePe Special Discount!
                                </div>
                                <div className="discount-banner-sub">
                                    Get {discountPercentage}% OFF on your order
                                </div>
                            </div>
                            <div className="discount-banner-amount">
                                -₹{phonePeDiscountAmount}
                            </div>
                        </div>
                    )}

                    {/* ── UPI SECTION ── */}
                    <div className="upi-section">
                        <div className="upi-sec-hdr">
                            <div className="upi-sec-hdr-left">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                                <p className="upi-sec-label">UPI Payment Options</p>
                            </div>
                            <span style={{fontSize:12, color:"#94a3b8", fontWeight:700}}>Secure UPI</span>
                        </div>

                        <div className="upi-opts-card">

                            {/* PhonePe - RECOMMENDED with discount */}
                            {show.phonepe && (
                                <div 
                                    className={`pmt-opt ${activeTab===3 ? 'active-opt' : ''}`} 
                                    onClick={handlePhonePeClick} 
                                    style={{"--theme-color": "#5f259f"}}
                                >
                                    <div className="pmt-opt-left">
                                        <div className={`pmt-radio-wrap ${activeTab===3 ? 'checked' : ''}`}>
                                            <div className="pmt-radio-inner" />
                                        </div>
                                        <div className="pmt-opt-info">
                                            <div className="pmt-opt-top">
                                                <span>₹{activeTab === 3 ? totalMrp : baseTotal}</span>
                                                <span className="pmt-pipe">|</span>
                                                <span>PhonePe</span>
                                                <span className="discount-badge">🔥 SAVE {discountPercentage}%</span>
                                            </div>
                                            <p className="pmt-opt-sub sub-phonepe">
                                                Use PhonePe UPI & get ₹{phonePeDiscountAmount} off
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{display:"flex", alignItems:"center", gap:"8px"}}>
                                        {activeTab !== 3 && phonePeDiscountAmount > 0 && (
                                            <span className="saved-amount">Save ₹{phonePeDiscountAmount}</span>
                                        )}
                                        <img src="/assets/images/phonepe.svg" alt="PhonePe" width={28} height={28}
                                            onError={e=>{e.target.outerHTML='<svg width="28" height="28" viewBox="0 0 30 30"><circle cx="15" cy="15" r="15" fill="#5f259f"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="14" font-weight="bold">₱</text></svg>';}}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* GPay */}
                            {show.gpay && (
                                <div 
                                    className={`pmt-opt ${activeTab===2 ? 'active-opt' : ''}`} 
                                    onClick={() => handleOtherPaymentClick(2)} 
                                    style={{"--theme-color": "#1a73e8"}}
                                >
                                    <div className="pmt-opt-left">
                                        <div className={`pmt-radio-wrap ${activeTab===2 ? 'checked' : ''}`}>
                                            <div className="pmt-radio-inner" />
                                        </div>
                                        <div className="pmt-opt-info">
                                            <div className="pmt-opt-top">
                                                <span>₹{baseTotal}</span>
                                                <span className="pmt-pipe">|</span>
                                                <span>GPay</span>
                                            </div>
                                            <p className="pmt-opt-sub sub-gpay">Use Google Pay UPI</p>
                                        </div>
                                    </div>
                                    <img src="/assets/images/gpay_icon.svg" alt="GPay" width={28} height={28}
                                        onError={e=>{e.target.outerHTML='<svg width="28" height="28" viewBox="0 0 30 30"><circle cx="15" cy="15" r="15" fill="#fff" stroke="#e2e8f0"/><text x="50%" y="57%" dominant-baseline="middle" text-anchor="middle" font-size="14" font-weight="800" fill="#4285F4">G</text></svg>';}}
                                    />
                                </div>
                            )}

                            {/* Paytm */}
                            {show.paytm && (
                                <div 
                                    className={`pmt-opt ${activeTab===4 ? 'active-opt' : ''}`} 
                                    onClick={() => handleOtherPaymentClick(4)} 
                                    style={{"--theme-color": "#00baf2"}}
                                >
                                    <div className="pmt-opt-left">
                                        <div className={`pmt-radio-wrap ${activeTab===4 ? 'checked' : ''}`}>
                                            <div className="pmt-radio-inner" />
                                        </div>
                                        <div className="pmt-opt-info">
                                            <div className="pmt-opt-top">
                                                <span>₹{baseTotal}</span>
                                                <span className="pmt-pipe">|</span>
                                                <span>PayTM</span>
                                            </div>
                                            <p className="pmt-opt-sub sub-paytm">Pay using Paytm UPI</p>
                                        </div>
                                    </div>
                                    <img src="/assets/images/PAYTM.NS_BIG.svg" alt="Paytm" width={45} height={32}
                                        onError={e=>{e.target.outerHTML='<svg width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#00baf2"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">PayTM</text></svg>';}}
                                    />
                                </div>
                            )}

                            {/* BHIM */}
                            {show.bhim && (
                                <div 
                                    className={`pmt-opt ${activeTab===1 ? 'active-opt' : ''}`} 
                                    onClick={() => handleOtherPaymentClick(1)} 
                                    style={{"--theme-color": "#ea580c"}}
                                >
                                    <div className="pmt-opt-left">
                                        <div className={`pmt-radio-wrap ${activeTab===1 ? 'checked' : ''}`}>
                                            <div className="pmt-radio-inner" />
                                        </div>
                                        <div className="pmt-opt-info">
                                            <div className="pmt-opt-top">
                                                <span>₹{baseTotal}</span>
                                                <span className="pmt-pipe">|</span>
                                                <span>BHIM UPI</span>
                                            </div>
                                            <p className="pmt-opt-sub sub-bhim">Pay using BHIM or UPI apps.</p>
                                        </div>
                                    </div>
                                    <img src="https://upload.wikimedia.org/wikipedia/en/b/b3/Bhim_logo.png" alt="BHIM" width={28} height={28}
                                        style={{objectFit:"contain"}}
                                    />
                                </div>
                            )}

                            {/* Cashfree */}
                            {show.cashfree && (
                                <div 
                                    className={`pmt-opt ${activeTab===6 ? 'active-opt' : ''}`} 
                                    onClick={() => handleOtherPaymentClick(6)} 
                                    style={{"--theme-color": "#334155"}}
                                >
                                    <div className="pmt-opt-left">
                                        <div className={`pmt-radio-wrap ${activeTab===6 ? 'checked' : ''}`}>
                                            <div className="pmt-radio-inner" />
                                        </div>
                                        <div className="pmt-opt-info">
                                            <div className="pmt-opt-top">
                                                <span>₹{baseTotal}</span>
                                                <span className="pmt-pipe">|</span>
                                                <span>Card / Net Banking</span>
                                            </div>
                                            <p className="pmt-opt-sub sub-cashfree">Card / Net Banking via Cashfree.</p>
                                        </div>
                                    </div>
                                    <svg width="52" height="22" viewBox="0 0 120 40">
                                        <rect width="120" height="40" rx="4" fill="#334155"/>
                                        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
                                            fill="#fff" fontSize="13" fontWeight="700" fontFamily="Inter,sans-serif">
                                            CASHFREE
                                        </text>
                                    </svg>
                                </div>
                            )}

                        </div>{/* upi-opts-card */}
                    </div>{/* upi-section */}

                    {/* ── PRICE SUMMARY ── */}
                    <div className="price-box">
                        <h4 className="price-box-title">Order Details</h4>
                        <div className="price-row">
                            <span>Price ({itemCount} item{itemCount!==1?"s":""})</span>
                            <span>₹ {baseTotal}</span>
                        </div>
                        <div className="price-row">
                            <span>Delivery Charges</span>
                            <span className="price-free">FREE</span>
                        </div>
                        {activeTab === 3 && phonePeDiscountAmount > 0 && (
                            <div className="price-row">
                                <span style={{color: "#059669", fontWeight: 600}}>
                                    🎉 PhonePe Discount ({discountPercentage}% off)
                                </span>
                                <span className="price-discount">- ₹{phonePeDiscountAmount}</span>
                            </div>
                        )}
                        <div className="price-row">
                            <span>Discount Price</span>
                            <span className="price-strike">₹ {crossedMrp}</span>
                        </div>
                        <div className="price-total-row">
                            <div className="price-total-lbl">Total Amount</div>
                            <span className={`price-total-amt ${activeTab === 3 ? 'discounted' : ''}`}>
                                ₹ {totalMrp}
                            </span>
                        </div>
                        {activeTab === 3 && phonePeDiscountAmount > 0 && (
                            <div style={{marginTop: 8, textAlign: "right", fontSize: 12, color: "#059669", fontWeight: 600}}>
                                You saved ₹{phonePeDiscountAmount} with PhonePe!
                            </div>
                        )}
                    </div>

                    {/* ── SECURE PAY BANNER ── */}
                    <div className="secure-pay-wrap">
                        <img
                            src="/assets/images/SecurePay.svg"
                            alt="100% Safe Payments"
                            className="secure-pay-img"
                            onError={e=>{e.target.style.display="none";}}
                        />
                    </div>

                </div>{/* pmt-body */}

                {/* ══ STICKY FOOTER ══ */}
                <div className="pmt-footer">
                    <div className="pmt-footer-left">
                        <span className="pmt-footer-lbl">Total Price</span>
                        <div className={`pmt-footer-amt ${activeTab === 3 ? 'discounted' : ''}`}>
                            ₹{totalMrp}
                        </div>
                        {activeTab === 3 && phonePeDiscountAmount > 0 && (
                            <div className="pmt-footer-saved">
                                Saved ₹{phonePeDiscountAmount}
                            </div>
                        )}
                    </div>

                    <button
                        className="pmt-pay-btn"
                        onClick={handlePay}
                        disabled={loading}
                    >
                        {loading
                            ? <><span className="btn-spin"/>&nbsp;PROCESSING…</>
                            : activeTab === 3 && phonePeDiscountAmount > 0 
                                ? `PAY ₹${totalMrp} (SAVE ₹${phonePeDiscountAmount})`
                                : "PROCEED TO PAY"
                        }
                    </button>
                </div>

            </div>{/* pmt-page */}
        </>
    );
}
