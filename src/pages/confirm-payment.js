import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Head from "next/head";
import { trackPurchase } from "../utils/facebookPixel";


export default function ConfirmPayment() {
    const router = useRouter();
    const { orderId: queryOrderId, amount: queryAmount } = router.query;

    const [orderId, setOrderId] = useState("");
    const [amount, setAmount] = useState("");
    const [manualOrderId, setManualOrderId] = useState("");
    const [status, setStatus] = useState("PE_PENDING"); // PE_PENDING, PE_VERIFYING, PE_SUCCESS, PE_FAILED
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
    const [message, setMessage] = useState("Waiting for payment to be processed on Paytm/PhonePe...");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Set order details from query params or localStorage
    useEffect(() => {
        if (!mounted) return;
        
        let id = queryOrderId || "";
        let amt = queryAmount || "";

        if (!id) {
            id = localStorage.getItem("currentOrderId") || "";
        }
        if (!amt) {
            try {
                const cart = JSON.parse(localStorage.getItem("cart") || "[]");
                amt = cart.reduce((s, p) => s + Math.round((p.sellingPrice || 0) * (p.quantity || 1)), 0);
            } catch (_) {}
        }

        setOrderId(id);
        setAmount(amt);
        setManualOrderId(id);
    }, [mounted, queryOrderId, queryAmount]);

    // Countdown Timer
    useEffect(() => {
        if (!mounted || timeLeft <= 0 || status === "PE_SUCCESS") return;
        const timer = setTimeout(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, status, mounted]);

    // Format time left (MM:SS)
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    // Polling Verification
    useEffect(() => {
        if (!mounted || !orderId || status === "PE_SUCCESS" || timeLeft <= 0) return;

        const verifyPayment = async () => {
            try {
                const res = await fetch("/api/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId }),
                });
                const data = await res.json();
                if (data.verified) {
                    setStatus("PE_SUCCESS");
                    setMessage("Payment verified successfully! Redirecting...");
                    setTimeout(() => {
                        // Clear current order ID so next purchase creates a new one
                        localStorage.removeItem("currentOrderId");
                        localStorage.removeItem("cart");
                        window.dispatchEvent(new Event('storage'));
                        router.push(`/ordersummdary?order_id=${orderId}`);
                    }, 2000);
                }
            } catch (err) {
                console.error("Verification error during poll:", err);
            }
        };

        // Poll immediately, then every 5 seconds
        verifyPayment();
        const interval = setInterval(verifyPayment, 5000);

        return () => clearInterval(interval);
    }, [mounted, orderId, status, timeLeft, router]);

    // Manual Verification handler
    const handleManualVerify = async (e) => {
        if (e) e.preventDefault();
        const targetId = manualOrderId.trim();
        if (!targetId) {
            alert("Please enter a valid Order ID / Comment / UTR.");
            return;
        }

        setLoading(true);
        setStatus("PE_VERIFYING");
        setMessage("Checking Paytm transactions for matching details...");

        try {
            const res = await fetch("/api/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: targetId }),
            });
            const data = await res.json();
            if (data.verified) {
                setStatus("PE_SUCCESS");
                setMessage("Payment verified successfully! Redirecting...");
                // ✅ FB Purchase event — fires on actual payment confirmation
                try {
                    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
                    const purchaseValue = cartItems.reduce((s, p) => s + (parseFloat(p.sellingPrice)||0) * (parseInt(p.quantity)||1), 0);
                    trackPurchase({
                        orderId: targetId,
                        items: cartItems.map(p => ({ _id: p.id || p._id, sellingPrice: p.sellingPrice, quantity: p.quantity || 1 })),
                        totalValue: purchaseValue || parseFloat(amount) || 0,
                        currency: 'INR'
                    });
                    sessionStorage.setItem(`fb_purchase_tracked_${targetId}`, 'true');
                } catch(_) {}
                setTimeout(() => {

                    localStorage.removeItem("currentOrderId");
                    localStorage.removeItem("cart");
                    window.dispatchEvent(new Event('storage'));
                    router.push(`/ordersummdary?order_id=${targetId}`);
                }, 2000);
            } else {
                setStatus("PE_FAILED");
                setMessage(data.message || "Payment not found yet. Make sure you completed the payment with correct comment.");
                setLoading(false);
            }
        } catch (err) {
            console.error("Manual verify error:", err);
            setStatus("PE_FAILED");
            setMessage("Error connecting to verification server. Please try again.");
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <>
            <Head>
                <title>Verifying Payment – Paytm Native Link</title>
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
                .verify-page {
                    background: #f8fafc;
                    min-height: 100vh;
                    max-width: 600px;
                    margin: 0 auto;
                    box-shadow: 0 0 20px rgba(0,0,0,0.03);
                    padding: 24px 16px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .logo-section {
                    margin-bottom: 24px;
                    text-align: center;
                }
                .logo-text {
                    font-family: 'Outfit', sans-serif;
                    font-size: 24px;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.02em;
                }
                .logo-tag {
                    font-size: 11px;
                    font-weight: 700;
                    color: #0ea5e9;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* ── STATUS CARD ── */
                .status-card {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 28px 20px;
                    width: 100%;
                    text-align: center;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02);
                    margin-bottom: 20px;
                }

                /* Pulse loader */
                .pulse-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 80px;
                    margin-bottom: 16px;
                }
                .pulse-circle {
                    width: 54px;
                    height: 54px;
                    background-color: #e0f2fe;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .pulse-circle::before, .pulse-circle::after {
                    content: '';
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background-color: #0ea5e9;
                    opacity: 0.15;
                    animation: pulse 2s infinite ease-in-out;
                }
                .pulse-circle::after {
                    animation-delay: 1s;
                }
                .pulse-icon {
                    color: #0284c7;
                    z-index: 2;
                }

                /* Timer & text */
                .timer-box {
                    font-family: 'Outfit', sans-serif;
                    font-size: 26px;
                    font-weight: 800;
                    color: #0f172a;
                    margin-bottom: 8px;
                }
                .timer-desc {
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 500;
                    margin-bottom: 20px;
                }
                .status-msg {
                    font-size: 14px;
                    color: #334155;
                    line-height: 1.5;
                    font-weight: 500;
                    padding: 0 10px;
                }

                /* ── DETAILS BOX ── */
                .details-box {
                    background: #f1f5f9;
                    border-radius: 12px;
                    padding: 16px;
                    width: 100%;
                    margin-bottom: 20px;
                }
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    padding: 6px 0;
                }
                .detail-row:first-child { border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; margin-bottom: 4px; }
                .detail-lbl { color: #64748b; font-weight: 600; }
                .detail-val { color: #0f172a; font-weight: 700; }

                /* ── MANUAL OVERRIDE CARD ── */
                .manual-card {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 20px;
                    width: 100%;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.01);
                }
                .manual-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 15px;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 6px;
                }
                .manual-desc {
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.4;
                    margin-bottom: 16px;
                }
                .input-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 14px;
                }
                .text-input {
                    height: 46px;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 8px;
                    padding: 0 14px;
                    font-size: 14px;
                    font-family: inherit;
                    color: #0f172a;
                    font-weight: 600;
                    transition: border-color 0.2s;
                }
                .text-input:focus {
                    outline: none;
                    border-color: #0ea5e9;
                }
                .submit-btn {
                    height: 46px;
                    background: #0f172a;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background-color 0.2s, transform 0.15s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-family: inherit;
                }
                .submit-btn:hover:not(:disabled) { background-color: #1e293b; }
                .submit-btn:active:not(:disabled) { transform: translateY(1px); }
                .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

                /* Animations */
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.2; }
                    50% { transform: scale(1.5); opacity: 0.05; }
                    100% { transform: scale(1.8); opacity: 0; }
                }

                .spinner {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255,255,255,.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.65s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                /* Success styling override */
                .status-success {
                    border-color: #bbf7d0;
                    background: #f0fdf4;
                }
                .status-success .pulse-circle {
                    background-color: #dcfce7;
                }
                .status-success .pulse-icon {
                    color: #15803d;
                }
                .status-success .timer-box {
                    color: #15803d;
                }
            `}</style>

            <div className="verify-page">
                {/* ══ LOGO SECTION ══ */}
                <div className="logo-section">
                    <h1 className="logo-text">Flipkart Lite</h1>
                    <span className="logo-tag">UPI Secure Payment Gateway</span>
                </div>

                {/* ══ STATUS CARD ══ */}
                <div className={`status-card ${status === "PE_SUCCESS" ? "status-success" : ""}`}>
                    <div className="pulse-container">
                        <div className="pulse-circle">
                            {status === "PE_SUCCESS" ? (
                                <svg className="pulse-icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : (
                                <svg className="pulse-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                            )}
                        </div>
                    </div>

                    {status === "PE_SUCCESS" ? (
                        <div className="timer-box">Success!</div>
                    ) : timeLeft <= 0 ? (
                        <div className="timer-box" style={{color: "#ef4444"}}>Timed Out</div>
                    ) : (
                        <div className="timer-box">{formatTime(timeLeft)}</div>
                    )}

                    <div className="timer-desc">
                        {status === "PE_SUCCESS"
                            ? "Transaction Found!"
                            : timeLeft <= 0
                                ? "Auto-verification paused. Please verify manually below."
                                : "Auto-checking Paytm transaction ledger..."
                        }
                    </div>

                    <p className="status-msg">{message}</p>
                </div>

                {/* ══ DETAILS BOX ══ */}
                <div className="details-box">
                    <div className="detail-row">
                        <span className="detail-lbl">Verification VPA Comment</span>
                        <span className="detail-val" style={{color: "#0ea5e9"}}>{orderId}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-lbl">Total Amount</span>
                        <span className="detail-val">₹{amount}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-lbl">Verification Status</span>
                        <span className="detail-val" style={{color: status === "PE_SUCCESS" ? "#16a34a" : "#ca8a04"}}>
                            {status === "PE_SUCCESS" ? "VERIFIED" : status === "PE_VERIFYING" ? "VERIFYING..." : "PENDING"}
                        </span>
                    </div>
                </div>

                {/* ══ MANUAL CARD ══ */}
                <div className="manual-card">
                    <h3 className="manual-title">Manual Verification</h3>
                    <p className="manual-desc">
                        Once you finish paying in your UPI app, our system will automatically redirect you. If you are not redirected within 30 seconds, verify manually by clicking below:
                    </p>
                    <form onSubmit={handleManualVerify}>
                        <div className="input-wrap">
                            <input
                                type="text"
                                className="text-input"
                                placeholder="Order ID / Payment Comment"
                                value={manualOrderId}
                                onChange={(e) => setManualOrderId(e.target.value)}
                                disabled={loading || status === "PE_SUCCESS"}
                            />
                        </div>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading || status === "PE_SUCCESS" || !manualOrderId.trim()}
                        >
                            {loading ? (
                                <><span className="spinner" /> VERIFYING...</>
                            ) : (
                                "VERIFY PAYMENT NOW"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
