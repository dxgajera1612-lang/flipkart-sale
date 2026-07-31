import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { trackInitiateCheckout } from "../../utils/facebookPixel";

// ── State Code Map ─────────────────────────────────────────────────────────────
const STATE_MAP = {
  "Andhra Pradesh": "AP", "Arunachal Pradesh": "AR", "Assam": "AS",
  "Bihar": "BR", "Chhattisgarh": "CT", "Goa": "GA", "Gujarat": "GJ",
  "Haryana": "HR", "Himachal Pradesh": "HP", "Jammu and Kashmir": "JK",
  "Jammu & Kashmir": "JK", "Jharkhand": "JH", "Karnataka": "KA",
  "Kerala": "KL", "Madhya Pradesh": "MP", "Maharashtra": "MH",
  "Manipur": "MN", "Meghalaya": "ML", "Mizoram": "MZ", "Nagaland": "NL",
  "Odisha": "OR", "Punjab": "PB", "Rajasthan": "RJ", "Sikkim": "SK",
  "Tamil Nadu": "TN", "Telangana": "TS", "Tripura": "TR",
  "Uttarakhand": "UK", "Uttar Pradesh": "UP", "West Bengal": "WB",
  "Andaman and Nicobar Islands": "AN", "Andaman & Nicobar": "AN",
  "Chandigarh": "CH", "Dadra and Nagar Haveli": "DN",
  "Daman and Diu": "DD", "Daman & Diu": "DD", "Delhi": "DL",
  "Lakshadweep": "LD", "Puducherry": "PY", "Pondicherry": "PY",
};

// ── Main Component ─────────────────────────────────────────────────────────────
const Address = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem("fb_checkout_tracked")) {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const total = cart.reduce((s, p) => s + Math.round((p.sellingPrice || p.selling_price || p.price || 0) * (p.quantity || 1)), 0);
        if (cart.length > 0) {
          trackInitiateCheckout(cart, total);
          sessionStorage.setItem("fb_checkout_tracked", "true");
        }
      }
    } catch (err) {
      console.error("FB Pixel InitiateCheckout error:", err);
    }
  }, []);

  const [values, setValues] = useState({
    fname: "",
    mobile: "",
    pincode: "",
    city: "",
    state: "",
    house: "",
    colonny: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear error for the field as user types
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!values.fname.trim())    newErrors.fname   = "Full name is required";
    if (!values.mobile.trim())   newErrors.mobile  = "Mobile number is required";
    return newErrors;
  };

  const handleSubmit = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    try {
      const userData = {
        name: values.fname,
        phone: String(values.mobile).replace(/\D/g, ''),
        email: `${String(values.mobile).replace(/\D/g, '')}@customer.com`,
        pincode: values.pincode,
        city: values.city,
        state: values.state,
        address: `${values.house}, ${values.colonny}`,
      };
      localStorage.setItem("user", JSON.stringify(userData));
      router.push("/payment");
    } catch (err) {
      console.error("Failed to save address:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Geolocation ──────────────────────────────────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};

          const fieldsToSet = {
            city: addr.city || addr.town || addr.village || addr.county || "",
            state: STATE_MAP[addr.state || ""] || "",
            pincode: addr.postcode || "",
            colonny: addr.suburb || addr.neighbourhood || addr.road || "",
            house: addr.house_number
              ? `${addr.house_number}${addr.road ? ", " + addr.road : ""}`
              : addr.road || "",
          };

          setValues((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(fieldsToSet).filter(([, v]) => v)
            ),
          }));
        } catch {
          setLocationError("Could not fetch address. Please fill manually.");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocationError("Location access denied. Please allow location permission.");
        setLocationLoading(false);
      },
      { timeout: 10000, maximumAge: 0 }
    );
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .addr-page {
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          max-width: 600px;
          margin: 0 auto;
          box-shadow: 0 0 20px rgba(0,0,0,0.03);
          padding-bottom: 120px;
        }

        /* Header */
        .addr-header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; border-bottom: 1px solid #e2e8f0;
          position: sticky; top: 0; background: #fff; z-index: 10;
        }
        .addr-header h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;
        }
        .back-btn { display: flex; align-items: center; text-decoration: none; color: #475569; }

        /* Stepper */
        .stepper {
          display: flex; justify-content: center; align-items: center;
          gap: 0; padding: 14px 16px; border-bottom: 1px solid #e2e8f0;
          background: #fff;
        }
        .step { display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center; }
        .step-circle {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Outfit', sans-serif;
          font-size: 12px; font-weight: 700; border: 2px solid #e2e8f0;
          background: #fff; color: #94a3b8; z-index: 1; position: relative;
        }
        .step-circle.done { background: #2874f0; border-color: #2874f0; color: #fff; }
        .step-circle.active { background: #2874f0; border-color: #2874f0; color: #fff; }
        .step-label {
          font-family: 'Outfit', sans-serif;
          font-size: 11px; margin-top: 5px; color: #94a3b8; font-weight: 700;
          letter-spacing: 0.03em; text-transform: uppercase; line-height: 1.25;
        }
        .step-label.active { color: #2874f0; font-weight: 800; }
        .step-label.done { color: #2874f0; font-weight: 700; }
        .step-line { flex: 1; height: 2px; background: #e2e8f0; margin-top: -16px; }
        .step-line.done { background: #2874f0; }

        /* Body */
        .addr-body { padding: 16px 16px 20px; background: #fff; margin-top: 10px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }

        /* Section heading */
        .section-heading {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 0 14px; font-size: 15px;
          font-weight: 700; color: #0f172a;
          font-family: 'Outfit', sans-serif;
        }

        /* Location button */
        .location-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; width: 100%; padding: 12px 14px;
          border: 1.5px dashed #ffc200; border-radius: 10px;
          background: #fffdf0; color: #d97706; font-size: 13px;
          font-weight: 700; cursor: pointer; margin-bottom: 14px;
          transition: all 0.2s; font-family: inherit;
        }
        .location-btn:hover:not(:disabled) { background: #fffbeb; }
        .location-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .location-error {
          font-size: 11px; color: #ef4444;
          margin: -8px 0 12px; padding: 0 2px;
          font-weight: 500;
        }

        /* Divider */
        .or-divider {
          display: flex; align-items: center; gap: 10px;
          color: #94a3b8; font-size: 11px; margin: 0 0 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .or-divider::before, .or-divider::after {
          content: ''; flex: 1; height: 1px; background: #e2e8f0;
        }

        /* Fields */
        .form-floating { margin-bottom: 12px; position: relative; }
        .form-floating > .form-control,
        .form-floating > .form-select {
          height: 50px; font-size: 13px;
          padding-top: 18px; padding-bottom: 4px;
          font-family: inherit;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          color: #0f172a;
          font-weight: 500;
        }
        .form-floating > label {
          font-size: 12px; padding-top: 10px; color: #64748b; font-weight: 500;
        }
        .form-floating > .form-control:focus,
        .form-floating > .form-select:focus {
          border-color: #2874f0;
          box-shadow: 0 0 0 0.15rem rgba(40,116,240,0.15);
          outline: none;
        }

        /* Row (city + state) */
        .two-col { display: flex; gap: 10px; margin-bottom: 12px; }
        .two-col .form-floating { flex: 1; margin-bottom: 0; }

        /* Footer CTA */
        .addr-footer {
          position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 600px;
          background: #fff; padding: 12px 16px;
          border-top: 1px solid #e2e8f0; z-index: 10;
          box-shadow: 0 -10px 30px rgba(0,0,0,0.03);
        }
        .save-btn {
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 48px; border: none; border-radius: 10px;
          background: #fb641b; color: #fff; font-size: 14px;
          font-weight: 700; cursor: pointer; font-family: inherit;
          letter-spacing: 0.02em; transition: background-color 0.2s;
          box-shadow: 0 4px 12px rgba(251,100,27,0.15);
          position: relative; overflow: hidden; isolation: isolate; color-scheme: light;
        }
        .save-btn:hover:not(:disabled) { background: #e05300; }
        .save-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Validation */
        .form-floating > .form-control.is-invalid,
        .form-floating > .form-select.is-invalid {
          border-color: #ef4444;
          box-shadow: none;
        }
        .field-error {
          font-size: 11px; color: #ef4444;
          margin-top: 4px; padding-left: 2px;
          font-weight: 500;
        }
      `}</style>

      <div className="addr-page">
        {/* ── Header ── */}
        <div className="addr-header">
          <button type="button" className="back-btn" onClick={() => router.push("/cart")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <svg width={22} height={22} viewBox="0 0 20 20" fill="none">
              <path d="M13.746 2.314a1.5 1.5 0 0 0-2.14 0L5.475 9.243a1.5 1.5 0 0 0 0 2.114l6.131 6.929a1.5 1.5 0 0 0 2.14-2.113L8.29 10l5.456-6.173a1.5 1.5 0 0 0 0-2.113z" fill="#666" />
            </svg>
          </button>
          <h4>Add delivery address</h4>
        </div>

        {/* ── Stepper ── */}
        <div className="stepper">
          <div className="step">
            <div className="step-circle done">✓</div>
            <div className="step-label done">Cart</div>
          </div>
          <div className="step-line done" />
          <div className="step">
            <div className="step-circle active">2</div>
            <div className="step-label active">Address</div>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-circle">3</div>
            <div className="step-label">Payment</div>
          </div>
        </div>

        {/* ── Form body ── */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="addr-body">
          <div className="section-heading">
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <path d="M10 0s-6.85-.044-7.35 6.43C2.2 12.165 8 16.915 9.82 17.929a.58.58 0 0 0 .36.087c.1 0 .187-.03.274-.087C12.286 16.915 18.093 12.165 17.35 6.43 16.849-.044 10 0 10 0zm0 9.718a2.718 2.718 0 1 1 0-5.436 2.718 2.718 0 0 1 0 5.436z" fill="#90B1FB" />
            </svg>
            Delivery Address
          </div>

          {/* Full Name */}
          <div className="form-floating">
            <input
              className={`form-control${errors.fname ? " is-invalid" : ""}`}
              type="text"
              id="fname"
              name="fname"
              placeholder="Full Name"
              value={values.fname}
              onChange={handleChange}
            />
            <label htmlFor="fname">Full Name *</label>
            {errors.fname && <div className="field-error">{errors.fname}</div>}
          </div>

          {/* Mobile */}
          <div className="form-floating">
            <input
              className={`form-control${errors.mobile ? " is-invalid" : ""}`}
              type="tel"
              id="mobile"
              name="mobile"
              placeholder="Mobile Number"
              maxLength={10}
              value={values.mobile}
              onChange={handleChange}
            />
            <label htmlFor="mobile">Mobile Number *</label>
            {errors.mobile && <div className="field-error">{errors.mobile}</div>}
          </div>

          {/* Pincode */}
          <div className="form-floating">
            <input
              className={`form-control${errors.pincode ? " is-invalid" : ""}`}
              type="text"
              id="pincode"
              name="pincode"
              placeholder="Pincode"
              maxLength={6}
              value={values.pincode}
              onChange={handleChange}
            />
            <label htmlFor="pincode">Pincode *</label>
            {errors.pincode && <div className="field-error">{errors.pincode}</div>}
          </div>

          {/* City + State */}
          <div className="two-col">
            <div className="form-floating">
              <input
                className={`form-control${errors.city ? " is-invalid" : ""}`}
                type="text"
                id="city"
                name="city"
                placeholder="City"
                value={values.city}
                onChange={handleChange}
              />
              <label htmlFor="city">City *</label>
              {errors.city && <div className="field-error">{errors.city}</div>}
            </div>
            <div className="form-floating">
              <select
                className={`form-select${errors.state ? " is-invalid" : ""}`}
                id="state"
                name="state"
                value={values.state}
                onChange={handleChange}
              >
                <option value="">Select State</option>
                {[
                  ["AP", "Andhra Pradesh"], ["AR", "Arunachal Pradesh"], ["AS", "Assam"],
                  ["BR", "Bihar"], ["CT", "Chhattisgarh"], ["GA", "Goa"], ["GJ", "Gujarat"],
                  ["HR", "Haryana"], ["HP", "Himachal Pradesh"], ["JK", "Jammu & Kashmir"],
                  ["JH", "Jharkhand"], ["KA", "Karnataka"], ["KL", "Kerala"],
                  ["MP", "Madhya Pradesh"], ["MH", "Maharashtra"], ["MN", "Manipur"],
                  ["ML", "Meghalaya"], ["MZ", "Mizoram"], ["NL", "Nagaland"],
                  ["OR", "Odisha"], ["PB", "Punjab"], ["RJ", "Rajasthan"], ["SK", "Sikkim"],
                  ["TN", "Tamil Nadu"], ["TS", "Telangana"], ["TR", "Tripura"],
                  ["UK", "Uttarakhand"], ["UP", "Uttar Pradesh"], ["WB", "West Bengal"],
                  ["AN", "Andaman & Nicobar"], ["CH", "Chandigarh"], ["DN", "Dadra & NH"],
                  ["DD", "Daman & Diu"], ["DL", "Delhi"], ["LD", "Lakshadweep"], ["PY", "Puducherry"],
                ].map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              <label htmlFor="state">State *</label>
              {errors.state && <div className="field-error">{errors.state}</div>}
            </div>
          </div>

          {/* House */}
          <div className="form-floating">
            <input
              className="form-control"
              type="text"
              id="house"
              name="house"
              placeholder="Flat, House no, Building"
              value={values.house}
              onChange={handleChange}
            />
            <label htmlFor="house">House No., Building Name</label>
          </div>

          {/* Colony */}
          <div className="form-floating">
            <input
              className="form-control"
              type="text"
              id="colonny"
              name="colonny"
              placeholder="Area, Colony, Street"
              value={values.colonny}
              onChange={handleChange}
            />
            <label htmlFor="colonny">Road Name, Area, Colony</label>
          </div>
        </form>

        {/* ── Fixed footer CTA ── */}
        <div className="addr-footer">
          <button
            type="submit"
            className="save-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save Address and Continue"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Address;
