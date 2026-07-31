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
  const [qrImageUrl, setQrImageUrl] = useState("");
  
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

    let storedOrderId = "ORDER" + Math.floor(100000 + Math.random() * 900000);
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
  
  const { originalTotal, discount } = (() => {
    if (cart.length === 0) return { originalTotal: 0, discount: 0 };
    const originalTotal = cart.reduce(
      (s, p) => s + Math.round(parseFloat(p.originalPrice || p.mrp || p.price || 0) * parseInt(p.quantity || 1)),
      0
    );
    return { originalTotal, discount: originalTotal - totalMrp };
  })();

  const displayOriginalTotal = originalTotal > 0 ? originalTotal : Math.round(totalMrp * 13.9);
  const displayDiscount = discount > 0 ? discount : displayOriginalTotal - totalMrp;

  /* ── BUILD UPI DEEP-LINKS ── */
  const buildPaymentLink = () => {
    if (!mounted || !activeTab || !orderId || activeTab === 6) {
      return "";
    }
    
    const amt = totalMrp;
    const id = products.id || "paytmqr281005050101150495811776@paytm";
    const merchantName = products.Phonepe2Name || "Merchant Payment";

    let url = "";

    if (activeTab === 3) {
      // PhonePe - Fixed payload structure
      const ppPayload = {
        p2pPaymentCheckoutParams: {
          checkoutType: "COLLECT",
          initialAmount: amt * 100,
          note: { type: "text", message: orderId },
          supportedInstruments: -1
        },
        contact: { type: "EXTERNAL_MERCHANT", name: merchantName, vpa: id }
      };
      const base64Payload = btoa(JSON.stringify(ppPayload));
      url = `phonepe://native?data=${encodeURIComponent(base64Payload)}&id=p2ppayment`;
    } else if (activeTab === 4) {
      // Paytm - Fixed URL structure
      const paytmParams = new URLSearchParams({
        pa: id,
        pn: merchantName,
        am: amt.toString(),
        cu: "INR",
        tn: orderId,
        tr: orderId,
        mc: "4722"
      });
      url = `paytmmp://cash_wallet?pa=${id}&pn=Sale%20Hub&am=278&cu=INR&tn=${orderId}&tr=${orderId}&mc=4722&&sign=AAuN7izDWN5cb8A5scnUiNME+LkZqI2DWgkXlN1McoP6WZABa/KkFTiLvuPRP6/nWK8BPg/rPhb+u4QMrUEX10UsANTDbJaALcSM9b8Wk218X+55T/zOzb7xoiB+BcX8yYuYayELImXJHIgL/c7nkAnHrwUCmbM97nRbCVVRvU0ku3Tr&featuretype=money_transfer`;
    } else if (activeTab === 2) {
      // GPay
      const gpayParams = new URLSearchParams({
        pa: id,
        pn: merchantName,
        am: amt.toString(),
        cu: "INR",
        tr: orderId
      });
      url = `tez://upi/pay?${gpayParams.toString()}`;
    } else {
      // Generic UPI
      const upiParams = new URLSearchParams({
        pa: id,
        pn: merchantName,
        am: amt.toString(),
        cu: "INR",
        tr: orderId
      });
      url = `upi://pay?${upiParams.toString()}`;
    }
    
    return url;
  };

  // Generate QR code URL
  const generateQrUrl = () => {
    if (!payUrl) {
      // Fallback UPI URL
      const fallbackUrl = `upi://pay?pa=${products.id || "paytmqr281005050101150495811776@paytm"}&am=${totalMrp}&cu=INR&tr=${orderId}`;
      return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fallbackUrl)}`;
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payUrl)}`;
  };

  useEffect(() => {
    const url = buildPaymentLink();
    setPayUrl(url);
    setQrImageUrl(generateQrUrl());
  }, [mounted, activeTab, orderId, totalMrp, products]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${String(secs).padStart(2, "0")}s`;
  };

  const formatTimerDigital = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  // ── VERIFICATION FUNCTION ──
  const verifyPayment = async () => {
    if (isVerifyingRef.current || isVerified) return;
    
    isVerifyingRef.current = true;
    setIsVerifying(true);
    setVerificationStatus("Checking payment...");

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, utrNo: "", remark: "", comment: "" }),
      });

      const data = await response.json();

      if (data.verified && data.transaction) {
        setIsVerified(true);
        setVerificationStatus("✅ Verified!");
        setIsVerifying(false);
        isVerifyingRef.current = false;
        
        if (verificationIntervalRef.current) {
          clearInterval(verificationIntervalRef.current);
          verificationIntervalRef.current = null;
        }
        
        if (typeof window !== "undefined") {
          localStorage.setItem("lastVerifiedTransaction", JSON.stringify(data.transaction));
        }
        
        setTimeout(() => {
          setShowVerifyModal(false);
          setShowQrModal(false);
          router.push(`/ordersummdary?order_id=${orderId}&amount=${totalMrp}`);
        }, 1500);
        
        return true;
      } else {
        setVerificationAttempts(prev => prev + 1);
        setVerificationStatus(`Attempt ${verificationAttempts + 1}/12`);
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

  const startVerification = () => {
    if (verificationIntervalRef.current) {
      clearInterval(verificationIntervalRef.current);
      verificationIntervalRef.current = null;
    }

    setVerificationAttempts(0);
    setVerificationStatus("Starting...");
    setIsVerified(false);
    isVerifyingRef.current = false;
    
    setTimeout(() => verifyPayment(), 3000);

    verificationIntervalRef.current = setInterval(() => {
      if (!isVerified && !isVerifyingRef.current) {
        verifyPayment();
      }
      if (verificationAttempts >= 11) {
        if (verificationIntervalRef.current) {
          clearInterval(verificationIntervalRef.current);
          verificationIntervalRef.current = null;
        }
        setVerificationStatus("⏰ Timeout. Please check manually.");
        setIsVerifying(false);
        isVerifyingRef.current = false;
      }
    }, 5000);
  };

  const handlePay = () => {
    if (activeTab === 3) {
      // PhonePe
      setModalType("phonepe");
      setShowVerifyModal(true);
      if (payUrl) {
        window.location.href = payUrl;
      }
      setTimeout(startVerification, 3000);
    } else if (activeTab === 4) {
      // Paytm
      setModalType("paytm");
      setShowVerifyModal(true);
      if (payUrl) {
        window.location.href = payUrl;
      }
      setTimeout(startVerification, 3000);
    } else if (activeTab === 5) {
      // QR Code
      setModalType("qr");
      setShowQrModal(true);
      // Generate fresh QR
      setQrImageUrl(generateQrUrl());
      setTimeout(startVerification, 3000);
    } else if (activeTab === 1) {
      // BHIM
      setModalType("qr");
      setShowQrModal(true);
      setQrImageUrl(generateQrUrl());
      setTimeout(startVerification, 3000);
    } else if (activeTab === 2) {
      // GPay
      setModalType("gpay");
      setShowVerifyModal(true);
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

  const handleManualVerify = () => {
    if (!isVerified && !isVerifyingRef.current) {
      if (verificationIntervalRef.current) {
        clearInterval(verificationIntervalRef.current);
        verificationIntervalRef.current = null;
      }
      startVerification();
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        alert('UPI link copied to clipboard!');
      }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('UPI link copied to clipboard!');
      });
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('UPI link copied to clipboard!');
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `qr-${orderId}.png`;
    link.href = qrImageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openUpiApp = () => {
    if (payUrl) {
      window.location.href = payUrl;
    }
  };

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
        <title>Payment - Checkout</title>
        <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,maximum-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #f5f5f5;
          color: #1a1a2e;
          -webkit-tap-highlight-color: transparent;
          overflow-x: hidden;
        }
      `}</style>

      <style jsx>{`
        .pmt-page {
          background: #f5f5f5;
          min-height: 100vh;
          max-width: 480px;
          margin: 0 auto;
          padding-bottom: 85px;
          overflow-x: hidden;
        }

        .pmt-top-nav {
          background: #fff;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid #eee;
        }
        .pmt-back-icn {
          background: none;
          border: none;
          padding: 4px 8px;
          cursor: pointer;
          color: #1a1a2e;
          display: flex;
          align-items: center;
        }
        .pmt-hdr-title {
          font-size: 16px;
          font-weight: 700;
          margin-left: 8px;
          flex: 1;
        }
        .pmt-hdr-badge {
          font-size: 11px;
          background: #e8f5e9;
          color: #2e7d32;
          padding: 2px 10px;
          border-radius: 12px;
          font-weight: 600;
        }

        .stepper-container {
          background: #fff;
          padding: 10px 16px 8px;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #eee;
        }
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }
        .step-badge {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }
        .step-badge.checked {
          background: #1a73e8;
          color: #fff;
        }
        .step-badge.active {
          background: #1a73e8;
          color: #fff;
          box-shadow: 0 2px 8px rgba(26,115,232,0.3);
        }
        .step-badge.inactive {
          background: #e0e0e0;
          color: #999;
        }
        .step-txt {
          font-size: 9px;
          font-weight: 600;
          color: #888;
          margin-top: 2px;
        }
        .step-txt.active-txt {
          color: #1a73e8;
        }
        .step-divider {
          flex: 1;
          height: 2px;
          background: #1a73e8;
          margin: 0 4px 10px;
        }
        .step-divider.inactive {
          background: #e0e0e0;
        }

        .offer-timer-box {
          background: #fff3e0;
          padding: 8px 14px;
          margin: 8px 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid #ffe0b2;
        }
        .offer-timer-label {
          font-size: 12px;
          font-weight: 600;
          color: #e65100;
        }
        .offer-timer-val {
          font-size: 14px;
          font-weight: 800;
          color: #d32f2f;
          background: #fff;
          padding: 2px 12px;
          border-radius: 12px;
        }

        .product-summary-card {
          background: #fff;
          margin: 8px 16px;
          border-radius: 10px;
          padding: 12px 14px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .product-summary-title {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
        }
        .product-summary-title span {
          font-size: 11px;
          font-weight: 400;
          color: #888;
        }
        .product-item {
          display: flex;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid #f0f0f0;
        }
        .product-item:last-child {
          border-bottom: none;
        }
        .product-image {
          width: 75px;
          height: 75px;
          border-radius: 6px;
          background: #f8f9fa;
          object-fit: cover;
          flex-shrink: 0;
        }
        .product-info {
          flex: 1;
          min-width: 0;
        }
        .product-name {
          font-size: 12px;
          font-weight: 600;
          color: #1a1a2e;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-assured {
          font-size: 9px;
          color: #1a73e8;
          font-weight: 600;
          background: #e8f0fe;
          padding: 0 8px;
          border-radius: 8px;
          display: inline-block;
        }
        .product-price-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 2px;
        }
        .product-selling-price {
          font-size: 14px;
          font-weight: 800;
          color: #1a1a2e;
        }
        .product-original-price {
          font-size: 11px;
          color: #999;
          text-decoration: line-through;
        }
        .product-discount-badge {
          font-size: 10px;
          font-weight: 700;
          color: #2e7d32;
          background: #e8f5e9;
          padding: 0 8px;
          border-radius: 8px;
        }
        .product-qty {
          font-size: 11px;
          color: #888;
        }

        .pmt-methods-wrap {
          padding: 0 16px;
        }
        .pmt-methods-title {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1a1a2e;
        }
        .pmt-card-opt {
          background: #fff;
          border: 2px solid #e8e8e8;
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
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
          border-color: #1a73e8;
          background: #f4f8fc;
        }
        .pmt-card-opt .check-mark {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #1a73e8;
          font-size: 16px;
        }
        .pmt-app-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          object-fit: contain;
          flex-shrink: 0;
        }
        .pmt-app-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a2e;
        }
        .pmt-app-sub {
          font-size: 10px;
          color: #888;
        }

        .price-details-card {
          background: #fff;
          margin: 8px 16px;
          border-radius: 10px;
          padding: 12px 14px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .price-dtl-title {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          padding: 3px 0;
        }
        .price-row .label {
          color: #666;
        }
        .price-row .value {
          font-weight: 500;
        }
        .price-row.discount-row .value {
          color: #2e7d32;
          font-weight: 700;
        }
        .price-row.free-delivery .value {
          color: #2e7d32;
          font-weight: 700;
        }
        .price-divider {
          height: 1px;
          background: #eee;
          margin: 6px 0;
        }
        .price-row.total-row {
          font-size: 15px;
          font-weight: 800;
          padding-top: 6px;
          border-top: 2px dashed #eee;
          margin-top: 4px;
        }

        .savings-badge {
          background: #e8f5e9;
          color: #1b5e20;
          padding: 6px 14px;
          border-radius: 8px;
          margin: 6px 16px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
        }
        .savings-badge span {
          font-size: 15px;
        }

        .trust-badge {
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 6px 16px;
          margin: 4px 16px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        .trust-badge-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #666;
          font-weight: 500;
        }
        .trust-badge-item .icon {
          font-size: 14px;
        }

        .sticky-bottom-bar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 480px;
          background: #fff;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
          z-index: 90;
          border-top: 1px solid #eee;
        }
        .price-display {
          display: flex;
          flex-direction: column;
        }
        .price-strike-small {
          font-size: 11px;
          color: #999;
          text-decoration: line-through;
        }
        .price-val-main {
          font-size: 20px;
          font-weight: 800;
          color: #1a1a2e;
        }
        .continue-btn {
          background: linear-gradient(135deg, #f7bb07, #f5a623);
          color: #1a1a2e;
          font-size: 14px;
          font-weight: 700;
          border: none;
          padding: 10px 28px;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(247,187,7,0.3);
          transition: all 0.2s;
          white-space: nowrap;
        }
        .continue-btn:active {
          transform: scale(0.96);
        }
        .continue-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 16px;
        }

        .verify-modal-card, .qr-modal-card {
          background: #fff;
          width: 100%;
          max-width: 360px;
          border-radius: 20px;
          padding: 20px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: popIn 0.25s ease-out;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        @keyframes popIn {
          from { transform: scale(0.95) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .brand-icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .brand-icon-circle.phonepe-bg {
          border: 3px solid #e0b0ff;
          background: #f7edff;
        }
        .brand-icon-circle.paytm-bg {
          border: 3px solid #b3e5fc;
          background: #e1f5fe;
        }
        .brand-icon-circle.gpay-bg {
          border: 3px solid #aecbff;
          background: #e8f0fe;
        }
        .brand-icon-circle.success-bg {
          border: 3px solid #4caf50;
          background: #e8f5e9;
        }

        .verify-heading {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .verify-heading.success {
          color: #2e7d32;
        }
        .verify-amount {
          font-size: 26px;
          font-weight: 800;
          color: #1a73e8;
          margin-bottom: 4px;
        }
        .verify-desc {
          font-size: 13px;
          color: #666;
          line-height: 1.4;
          margin-bottom: 14px;
        }
        .verify-desc strong {
          color: #1a1a2e;
        }

        .verify-btn {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          border: none;
          cursor: pointer;
          margin-bottom: 10px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.1);
        }
        .verify-btn.phonepe-btn { background: #5f259f; }
        .verify-btn.paytm-btn { background: #002970; }
        .verify-btn.gpay-btn { background: #1a73e8; }
        .verify-btn.verifying-btn {
          background: #999;
          cursor: not-allowed;
          opacity: 0.7;
        }
        .verify-btn.success-btn {
          background: #2e7d32;
          cursor: default;
        }

        .verify-subtext {
          font-size: 11px;
          color: #888;
        }

        .verify-loader {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top: 2px solid #fff;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
          vertical-align: middle;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .verification-status-box {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 8px 12px;
          margin: 8px 0 12px;
          border: 1px solid #eee;
        }
        .verification-status-text {
          font-size: 12px;
          color: #555;
        }

        .manual-check-btn {
          padding: 8px 16px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          color: #333;
          width: 100%;
          transition: background 0.2s;
        }
        .manual-check-btn:hover {
          background: #e8e8e8;
        }
        .manual-check-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .close-qr-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #f0f0f0;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qr-title {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 2px;
        }
        .qr-amt-sub {
          font-size: 14px;
          color: #555;
          margin-bottom: 10px;
          font-weight: 600;
        }
        .qr-amt-sub strong {
          color: #1a73e8;
          font-size: 18px;
        }
        .qr-img-box {
          background: #fff;
          border: 2px solid #eee;
          border-radius: 12px;
          padding: 8px;
          display: inline-block;
          margin-bottom: 8px;
        }
        .qr-img {
          width: 170px;
          height: 170px;
          object-fit: contain;
        }
        .qr-timer-lbl {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .qr-timer-lbl strong {
          color: #d32f2f;
        }
        .qr-actions-row {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        .qr-act-btn {
          flex: 1;
          background: #f0f0f0;
          border: 1px solid #ddd;
          padding: 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .qr-act-btn:hover {
          background: #e5e5e5;
        }
        .qr-footer-note {
          font-size: 11px;
          color: #888;
          margin-top: 6px;
        }

        @media (max-width: 400px) {
          .pmt-card-opt { padding: 8px 12px; }
          .pmt-app-title { font-size: 13px; }
          .price-val-main { font-size: 18px; }
          .continue-btn { padding: 8px 20px; font-size: 13px; }
          .product-selling-price { font-size: 13px; }
          .qr-img { width: 140px; height: 140px; }
        }

        @media (min-width: 481px) {
          .pmt-page { padding-bottom: 95px; }
        }
      `}</style>

      <div className="pmt-page">
        {/* Top Nav */}
        <div className="pmt-top-nav">
          <button className="pmt-back-icn" onClick={() => router.back()}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="pmt-hdr-title">Checkout</span>
          <span className="pmt-hdr-badge">🔒 3/3</span>
        </div>

        {/* Stepper */}
        <div className="stepper-container">
          <div className="step-item">
            <div className="step-badge checked">✓</div>
            <span className="step-txt">Address</span>
          </div>
          <div className="step-divider" />
          <div className="step-item">
            <div className="step-badge checked">✓</div>
            <span className="step-txt">Summary</span>
          </div>
          <div className="step-divider" />
          <div className="step-item">
            <div className="step-badge active">3</div>
            <span className="step-txt active-txt">Pay</span>
          </div>
        </div>

        {/* Timer */}
        <div className="offer-timer-box">
          <span className="offer-timer-label">⏰ Offer ends in</span>
          <span className="offer-timer-val">{formatTime(timeLeft)}</span>
        </div>

        {/* Product Summary */}
        <div className="product-summary-card">
          <div className="product-summary-title">
            Order Summary
            <span>{itemCount} item{itemCount > 1 ? 's' : ''}</span>
          </div>
          {cart.map((item, index) => (
            <div key={index} className="product-item">
              {item.images && item.images[0] ? (
                <img src={item.images[0]} alt={item.title} className="product-image" />
              ) : (
                <div className="product-image" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>📦</div>
              )}
              <div className="product-info">
                <div className="product-name">{item.title || 'Product'}</div>
                {item.assured && <span className="product-assured">✓ Assured</span>}
                <div className="product-price-row">
                  <span className="product-selling-price">₹{Math.round(parseFloat(item.sellingPrice || item.price || 0))}</span>
                  {item.originalPrice && <span className="product-original-price">₹{Math.round(parseFloat(item.originalPrice))}</span>}
                  {item.discountPercent && <span className="product-discount-badge">{item.discountPercent}% OFF</span>}
                  <span className="product-qty">Qty: {item.quantity || 1}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Methods */}
        <div className="pmt-methods-wrap">
          <div className="pmt-methods-title">Pay with</div>
          
          {products.Phonepe !== false && (
            <div className={`pmt-card-opt ${activeTab === 3 ? "selected-phonepe" : ""}`} onClick={() => setActiveTab(3)}>
              <img src="/assets/images/phonepe.svg" alt="PhonePe" className="pmt-app-logo" 
                onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%235f259f'/%3E%3Ctext x='50%25' y='58%25' text-anchor='middle' fill='%23fff' font-size='20' font-weight='bold'%3Eपे%3C/text%3E%3C/svg%3E"; }} />
              <div style={{ flex:1, textAlign:'left' }}>
                <div className="pmt-app-title">PhonePe</div>
                <div className="pmt-app-sub">UPI • Instant</div>
              </div>
              {activeTab === 3 && <span className="check-mark">✓</span>}
            </div>
          )}

          {products.Paytm !== false && (
            <div className={`pmt-card-opt ${activeTab === 4 ? "selected-paytm" : ""}`} onClick={() => setActiveTab(4)}>
              <img src="/assets/images/PAYTM.NS_BIG.svg" alt="Paytm" className="pmt-app-logo"
                onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%2300baf2'/%3E%3Ctext x='50%25' y='58%25' text-anchor='middle' fill='%23fff' font-size='12' font-weight='bold'%3EPaytm%3C/text%3E%3C/svg%3E"; }} />
              <div style={{ flex:1, textAlign:'left' }}>
                <div className="pmt-app-title">Paytm</div>
                <div className="pmt-app-sub">Wallet • UPI</div>
              </div>
              {activeTab === 4 && <span className="check-mark">✓</span>}
            </div>
          )}

          {products.Gpay !== false && (
            <div className={`pmt-card-opt ${activeTab === 2 ? "selected-generic" : ""}`} onClick={() => setActiveTab(2)}>
              <img src="/assets/images/gpay_icon.svg" alt="GPay" className="pmt-app-logo"
                onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%234285f4'/%3E%3Ctext x='50%25' y='58%25' text-anchor='middle' fill='%23fff' font-size='14' font-weight='bold'%3EGPay%3C/text%3E%3C/svg%3E"; }} />
              <div style={{ flex:1, textAlign:'left' }}>
                <div className="pmt-app-title">Google Pay</div>
                <div className="pmt-app-sub">UPI • Bank</div>
              </div>
              {activeTab === 2 && <span className="check-mark">✓</span>}
            </div>
          )}

          <div className={`pmt-card-opt ${activeTab === 5 ? "selected-generic" : ""}`} onClick={() => setActiveTab(5)}>
            <div style={{ width:32, height:32, borderRadius:8, background:'#f0f0f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📷</div>
            <div style={{ flex:1, textAlign:'left' }}>
              <div className="pmt-app-title">Scan QR</div>
              <div className="pmt-app-sub">Any UPI app</div>
            </div>
            {activeTab === 5 && <span className="check-mark">✓</span>}
          </div>
        </div>

        {/* Price Details */}
        <div className="price-details-card">
          <div className="price-dtl-title">💰 Price Details</div>
          <div className="price-row">
            <span className="label">Price ({itemCount} item)</span>
            <span className="value">₹{displayOriginalTotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="price-row discount-row">
            <span className="label">Discount</span>
            <span className="value">- ₹{displayDiscount.toLocaleString('en-IN')}</span>
          </div>
          <div className="price-row free-delivery">
            <span className="label">Delivery</span>
            <span className="value">FREE</span>
          </div>
          <div className="price-divider" />
          <div className="price-row total-row">
            <span>Total</span>
            <span>₹{totalMrp.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Savings */}
        {displayDiscount > 0 && (
          <div className="savings-badge">
            🎉 Saved ₹{displayDiscount.toLocaleString('en-IN')}!
          </div>
        )}

        {/* Trust */}
        <div className="trust-badge">
          <span className="trust-badge-item"><span className="icon">🔒</span> Secure</span>
          <span className="trust-badge-item"><span className="icon">⚡</span> Instant</span>
          <span className="trust-badge-item"><span className="icon">✓</span> Assured</span>
        </div>

        {/* Bottom Bar */}
        <div className="sticky-bottom-bar">
          <div className="price-display">
            <span className="price-strike-small">₹{displayOriginalTotal.toLocaleString('en-IN')}</span>
            <span className="price-val-main">₹{totalMrp.toLocaleString('en-IN')}</span>
          </div>
          <button className="continue-btn" onClick={handlePay} disabled={loading}>
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>

      {/* ══ VERIFICATION MODAL ══ */}
      {showVerifyModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isVerified) setShowVerifyModal(false); }}>
          <div className="verify-modal-card">
            {!isVerified ? (
              <>
                <div className={`brand-icon-circle ${modalType === 'phonepe' ? 'phonepe-bg' : modalType === 'paytm' ? 'paytm-bg' : 'gpay-bg'}`}>
                  {modalType === 'phonepe' &&<img src="/assets/images/phonepe.svg" alt="PhonePe" className="pmt-app-logo" 
                onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%235f259f'/%3E%3Ctext x='50%25' y='58%25' text-anchor='middle' fill='%23fff' font-size='20' font-weight='bold'%3Eपे%3C/text%3E%3C/svg%3E"; }} />
             }
                  {modalType === 'paytm' &&  <img src="/assets/images/PAYTM.NS_BIG.svg" alt="Paytm" className="pmt-app-logo"
                onError={(e) => { e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%2300baf2'/%3E%3Ctext x='50%25' y='58%25' text-anchor='middle' fill='%23fff' font-size='12' font-weight='bold'%3EPaytm%3C/text%3E%3C/svg%3E"; }} />
             }
                  {modalType === 'gpay' && <svg width="36" height="36" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#4285f4"/><text x="50%" y="56%" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold">GPay</text></svg>}
                </div>
                <div className="verify-heading">Complete Payment</div>
                <div className="verify-amount">₹{totalMrp.toLocaleString('en-IN')}</div>
                <p className="verify-desc">Pay with <strong>{modalType === 'phonepe' ? 'PhonePe' : modalType === 'paytm' ? 'Paytm' : 'GPay'}</strong></p>

                <button className={`verify-btn ${modalType === 'phonepe' ? 'phonepe-btn' : modalType === 'paytm' ? 'paytm-btn' : 'gpay-btn'} ${isVerifying ? 'verifying-btn' : ''}`}
                  onClick={() => { if (payUrl && !isVerifying) window.location.href = payUrl; }} disabled={isVerifying}>
                  {isVerifying ? <><span className="verify-loader"></span> Checking...</> : `Open ${modalType === 'phonepe' ? 'PhonePe' : modalType === 'paytm' ? 'Paytm' : 'GPay'}`}
                </button>

                <p className="verify-subtext">Keep this screen open for verification</p>
                <button className="manual-check-btn" onClick={handleManualVerify} disabled={isVerifying}>
                  {isVerifying ? "Checking..." : "🔄 Check Status"}
                </button>
              </>
            ) : (
              <>
                <div className="brand-icon-circle success-bg"><svg width="36" height="36" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#2e7d32"/><text x="50%" y="56%" textAnchor="middle" fill="#fff" fontSize="22">✓</text></svg></div>
                <div className="verify-heading success">✅ Verified!</div>
                <div className="verify-amount" style={{ color:'#2e7d32' }}>₹{totalMrp.toLocaleString('en-IN')}</div>
                <button className="verify-btn success-btn" disabled>✅ Confirmed</button>
                <p className="verify-subtext">Redirecting...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ QR MODAL ══ */}
      {showQrModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !isVerified) setShowQrModal(false); }}>
          <div className="qr-modal-card" style={{ position:'relative' }}>
            <button className="close-qr-btn" onClick={() => setShowQrModal(false)}>✕</button>
            {!isVerified ? (
              <>
                <div className="qr-title">📷 Scan QR</div>
                <div className="qr-amt-sub">Amount: <strong>₹{totalMrp.toLocaleString('en-IN')}</strong></div>
                <div className="qr-img-box">
                  <img src={qrImageUrl} alt="QR Code for Payment" className="qr-img" />
                </div>
                <div className="qr-timer-lbl">⏳ Expires in <strong>{formatTimerDigital(timeLeft)}</strong></div>
                <div className="qr-actions-row">
                  <button className="qr-act-btn" onClick={downloadQR}>⬇ Save</button>
                  <button className="qr-act-btn" onClick={() => copyToClipboard(payUrl || `upi://pay?pa=${products.id}&am=${totalMrp}&cu=INR&tr=${orderId}`)}>📋 Copy</button>
                </div>
                <p className="qr-footer-note">Scan with GPay, PhonePe, Paytm, or BHIM</p>
                <button className="manual-check-btn" onClick={handleManualVerify} disabled={isVerifying}>
                  {isVerifying ? "Checking..." : "🔄 Check Status"}
                </button>
              </>
            ) : (
              <>
                <div className="brand-icon-circle success-bg" style={{ margin:'0 auto 12px' }}><svg width="36" height="36" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#2e7d32"/><text x="50%" y="56%" textAnchor="middle" fill="#fff" fontSize="22">✓</text></svg></div>
                <div className="verify-heading success">✅ Verified!</div>
                <div className="verify-amount" style={{ color:'#2e7d32' }}>₹{totalMrp.toLocaleString('en-IN')}</div>
                <p className="verify-subtext">Redirecting to order summary...</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
