import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { trackInitiateCheckout } from "../utils/facebookPixel";


function Cart() {
  const [data133, setdata133] = useState([]);
  const [mySidenavopen, setmySidenavopen] = useState(true);
  const [products1, setProducts1] = useState({ pixelId: "" });
  const initialTime = 900;
  const [time, setTime] = useState(initialTime);

  // Load cart from localStorage once on mount
  useEffect(() => {
    const data1 = JSON.parse(localStorage.getItem("cart") || "[]");
    setdata133(data1);
  }, []);

  // Timer: runs independently, does not re-create on every tick
  useEffect(() => {
    if (time <= 0) return;
    const timer = setInterval(() => {
      setTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalMrp = data133.reduce(
    (sum, product) => sum + parseInt(product.sellingPrice * product.quantity),
    0
  );


  const removeItem = (id) => {
    const updated = JSON.parse(localStorage.getItem("cart") || "[]").filter(
      (el) => el.id !== id
    );
    localStorage.setItem("cart", JSON.stringify(updated));
    setdata133(updated);
  };

  const decreaseQty = (id) => {
    const updated = JSON.parse(localStorage.getItem("cart") || "[]").map((el) =>
      el.id === id && el.quantity > 1
        ? { ...el, quantity: el.quantity - 1 }
        : el
    );
    localStorage.setItem("cart", JSON.stringify(updated));
    setdata133(updated);
  };

  const increaseQty = (id) => {
    const updated = JSON.parse(localStorage.getItem("cart") || "[]").map((el) =>
      el.id === id ? { ...el, quantity: el.quantity + 1 } : el
    );
    localStorage.setItem("cart", JSON.stringify(updated));
    setdata133(updated);
  };

  return (
    data133 && (
      <div>
        <>
          <title>Sale Sale Sale - Home</title>
          <meta httpEquiv="Pragma" content="no-cache" />
          <meta httpEquiv="Expires" content={-1} />
          <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="Keywords" content="Maha Sale" />
          <meta name="Description" content="Maha Sale" />
          <meta property="og:title" content="Maha Sale" />
          <meta name="theme-color" content="#ffc200" id="themeColor" />
          <meta
            name="viewport"
            content="width=device-width,minimum-scale=1,user-scalable=no"
          />
          <link rel="shortcut icon" href="https://www.flipkart.com/favicon.ico" />
          <link rel="stylesheet" href="/assets/website/css/bootstrap.min.css" />
          <link rel="stylesheet" href="/assets/website/css/custom.css" />
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
            integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link
            href="https://fonts.googleapis.com/css2?family=Poppins&display=swap"
            rel="stylesheet"
          />
          <style
            dangerouslySetInnerHTML={{
              __html:
                "\n        body,\n        a,\n        p,\n        span,\n        div,\n        input,\n        button,\n        h1,\n        h2,\n        h3,\n        h4,\n        h5,\n        h6,\n        button,\n        input,\n        optgroup,\n        select,\n        textarea {\n            font-family: 'Poppins', sans-serif !important;\n        }\n    ",
            }}
          />
          {/* Meta Pixel Code */}
          <noscript>
            &lt;img height="1" width="1" style="display:none"
            src="https://www.facebook.com/tr?id=239159289163632&amp;ev=PageView&amp;noscript=1"
            /&gt;
          </noscript>
          {/* End Meta Pixel Code */}
          <link
            rel="stylesheet"
            href="chrome-extension://mhnlakgilnojmhinhkckjpncpbhabphi/content.css"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap"
          />
          <style
            id="_goober"
            dangerouslySetInnerHTML={{
              __html:
                " .go1475592160{height:0;}.go1671063245{height:auto;}.go1888806478{display:flex;flex-wrap:wrap;flex-grow:1;}@media (min-width:600px){.go1888806478{flex-grow:initial;min-width:288px;}}.go167266335{background-color:#313131;font-size:0.875rem;line-height:1.43;letter-spacing:0.01071em;color:#fff;align-items:center;padding:6px 16px;border-radius:4px;box-shadow:0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12);}.go3162094071{padding-left:20px;}.go3844575157{background-color:#313131;}.go1725278324{background-color:#43a047;}.go3651055292{background-color:#d32f2f;}.go4215275574{background-color:#ff9800;}.go1930647212{background-color:#2196f3;}.go946087465{display:flex;align-items:center;padding:8px 0;}.go703367398{display:flex;align-items:center;margin-left:auto;padding-left:16px;margin-right:-8px;}.go3963613292{width:100%;position:relative;transform:translateX(0);top:0;right:0;bottom:0;left:0;min-width:288px;}.go1141946668{box-sizing:border-box;display:flex;max-height:100%;position:fixed;z-index:1400;height:auto;width:auto;transition:top 300ms ease 0ms,right 300ms ease 0ms,bottom 300ms ease 0ms,left 300ms ease 0ms,max-width 300ms ease 0ms;pointer-events:none;max-width:calc(100% - 40px);}.go1141946668 .notistack-CollapseWrapper{padding:6px 0px;transition:padding 300ms ease 0ms;}@media (max-width:599.95px){.go1141946668{width:100%;max-width:calc(100% - 32px);}}.go3868796639 .notistack-CollapseWrapper{padding:2px 0px;}.go3118922589{top:14px;flex-direction:column;}.go1453831412{bottom:14px;flex-direction:column-reverse;}.go4027089540{left:20px;}@media (min-width:600px){.go4027089540{align-items:flex-start;}}@media (max-width:599.95px){.go4027089540{left:16px;}}.go2989568495{right:20px;}@media (min-width:600px){.go2989568495{align-items:flex-end;}}@media (max-width:599.95px){.go2989568495{right:16px;}}.go4034260886{left:50%;transform:translateX(-50%);}@media (min-width:600px){.go4034260886{align-items:center;}}",
            }}
          />
          <div id="container" style={{ overflow: "hidden" }}>
            <div style={{ height: "100%" }} data-reactroot="">
              <div>
                <div className="_2dxSCm">
                  <div className="_38U37R">
                    <div>
                      <div className="_1FWdmb" style={{backgroundColor:"#fff"}}>
                        <div className="d-flex align-items-center" style={{display:"flex",alignItems:"center"}}>
                          <Link
                            className="_3NH1qf "
                            id="back-btn"
                            href="/"
                            style={{ marginTop: 0 }}
                          >
                            <svg
                              width={25}
                              height={25}
                              viewBox="0 0 20 20"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              mt={2}
                              iconsize={24}
                              className="sc-gswNZR ffVWIj"
                            >
                              <path
                                d="M13.7461 2.31408C13.5687 2.113 13.3277 2 13.0765 2C12.8252 2 12.5843 2.113 12.4068 2.31408L6.27783 9.24294C5.90739 9.66174 5.90739 10.3382 6.27783 10.757L12.4068 17.6859C12.7773 18.1047 13.3757 18.1047 13.7461 17.6859C14.1166 17.2671 14.0511 16.5166 13.7461 16.1718L8.29154 9.99462L13.7461 3.82817C13.9684 3.57691 14.1071 2.72213 13.7461 2.31408Z"
                                fill="#666666"
                              />
                            </svg>
                          </Link>
                          <h4 className="header-title">CART</h4>
                        </div>
                        <div className="header-menu">
                          <a className="_3NH1qf" href="#">
                            <svg
                              width={24}
                              height={25}
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              ml={16}
                              iconsize={24}
                              className="sc-gswNZR dJzkYm"
                            >
                              <path fill="#fff" d="M0 .657h24v24H0z" />
                              <path fill="#fff" d="M2 2.657h20v20H2z" />
                              <path
                                d="M22 9.174c0 3.724-1.87 7.227-9.67 12.38a.58.58 0 0 1-.66 0C3.87 16.401 2 12.898 2 9.174S4.59 3.67 7.26 3.66c3.22-.081 4.61 3.573 4.74 3.774.13-.201 1.52-3.855 4.74-3.774C19.41 3.669 22 5.45 22 9.174Z"
                                fill="#ED3843"
                              />
                            </svg>
                          </a>
                          <a className="_3NH1qf" href="#" onclick="openNav()">
                            <svg
                              width={24}
                              height={25}
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              ml={16}
                              iconsize={24}
                              className="sc-gswNZR dJzkYm"
                            >
                              <g clipPath="url(#cart-header_svg__a)">
                                <path fill="#fff" d="M2.001 1.368h20v20h-20z" />
                                <g clipPath="url(#cart-header_svg__b)">
                                  <g clipPath="url(#cart-header_svg__c)">
                                    <path
                                      d="M6.003 5.183h15.139c.508 0 .908.49.85 1.046l-.762 7.334c-.069.62-.537 1.1-1.103 1.121l-12.074.492-2.05-9.993Z"
                                      fill="#C53EAD"
                                    />
                                    <path
                                      d="M11.8 21.367c.675 0 1.22-.597 1.22-1.334 0-.737-.545-1.335-1.22-1.335-.673 0-1.22.598-1.22 1.335s.547 1.334 1.22 1.334ZM16.788 21.367c.674 0 1.22-.597 1.22-1.334 0-.737-.546-1.335-1.22-1.335-.673 0-1.22.598-1.22 1.335s.547 1.334 1.22 1.334Z"
                                      fill="#9F2089"
                                    />
                                    <path
                                      d="m2.733 4.169 3.026 1.42 2.528 12.085c.127.609.615 1.036 1.181 1.036h9.615"
                                      stroke="#9F2089"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </g>
                                </g>
                              </g>
                              <defs>
                                <clipPath id="cart-header_svg__a">
                                  <path
                                    fill="#fff"
                                    transform="translate(2.001 1.368)"
                                    d="M0 0h20v20H0z"
                                  />
                                </clipPath>
                                <clipPath id="cart-header_svg__b">
                                  <path
                                    fill="#fff"
                                    transform="translate(2.001 1.368)"
                                    d="M0 0h20v20H0z"
                                  />
                                </clipPath>
                                <clipPath id="cart-header_svg__c">
                                  <path
                                    fill="#fff"
                                    transform="translate(2.001 3.368)"
                                    d="M0 0h20v18H0z"
                                  />
                                </clipPath>
                              </defs>
                            </svg>
                            <span className="header__cart-count header__cart-count--floating bubble-count">
                              {typeof localStorage !== "undefined" &&
                                localStorage.getItem("cart") &&
                                JSON.parse(localStorage.getItem("cart")).length}
                            </span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="sc-bBXxYQ jMfCEJ" />
                  <style
                    dangerouslySetInnerHTML={{
                      __html:
                        '\n    .cart-list {\n        max-height: max-content;\n        /* min-height: 30vh; */\n    }\n\n    .cart-product {\n        border-bottom: 5px solid #eaeaf2;\n    }\n\n    .cart_page_footer {\n        box-shadow: none;\n        position: unset;\n        border-bottom: 5px solid #eaeaf2;\n    }\n\n    .header-menu {\n        display: none;\n    }\n\n    .mc_pay__total {\n        padding: 5px 0;\n        color: rgb(53, 53, 67);\n        font-weight: 600;\n        font-size: 15px;\n        font-family: "Mier demi";\n        text-align: left;\n        line-height: 24px;\n    }\n\n    .cart__total,\n    .shipping__total,\n    .mc_pay__total {\n        padding: 10px 0;\n    }\n\n    .cart__total {\n        text-decoration: underline dotted;\n        color: rgb(53, 53, 67);\n        font-style: normal;\n        font-weight: 400;\n        font-size: 13px;\n        line-height: 20px;\n        font-family: "Mier book";\n        margin: 0px;\n        padding: 0px;\n        display: flex;\n        -webkit-box-align: center;\n        align-items: center;\n    }\n\n    .cart-qty {\n        color: rgb(53, 53, 67);\n        font-style: normal;\n        font-weight: 400;\n        font-size: 13px;\n        font-family: "Mier book";\n        white-space: nowrap;\n        margin-left: 8px;\n    }\n\n    .eGwEyP {\n        padding: 12px 16px;\n        display: flex;\n        -webkit-box-pack: justify;\n        justify-content: space-between;\n    }\n\n    .dUijPM {\n        display: flex;\n        flex-direction: column;\n        -webkit-box-pack: justify;\n        justify-content: space-between;\n        max-width: 50%;\n        padding-right: 8px;\n    }\n\n    .dUijPM span {\n        color: rgb(53, 53, 67);\n        font-weight: 700;\n        font-size: 17px;\n        line-height: 20px;\n        font-family: "Mier bold";\n    }\n\n    .dUijPM button {\n        font-weight: unset;\n        font-family: "Mier bold";\n    }\n\n    .ylmAj {\n        color: rgb(159, 32, 137);\n        cursor: pointer;\n        font-style: normal;\n        text-align: center;\n        letter-spacing: 0.0015em;\n        font-size: 13px;\n        font-weight: 700;\n        line-height: 16px;\n        border-radius: 4px;\n        background: inherit;\n        border: none;\n        padding: 0px;\n        white-space: nowrap;\n        overflow: hidden;\n        text-overflow: ellipsis;\n    }\n\n    .iAFVK {\n        width: 50%;\n    }\n\n    .iAFVK button {\n        width: 100%;\n        font-weight: 600;\n        font-family: "Mier demi";\n    }\n\n    .bwHzRF {\n        cursor: pointer;\n        font-style: normal;\n        text-align: center;\n        letter-spacing: 0.0015em;\n        font-size: 15px;\n        line-height: 20px;\n        border-radius: 4px;\n        color: rgb(255, 255, 255);\n        background: rgb(159, 32, 137);\n        border: none;\n        padding: 12px;\n        font-weight: 500;\n        width: 100%;\n        white-space: nowrap;\n        overflow: hidden;\n        text-overflow: ellipsis;\n    }\n\n    .ixHOyU {\n        position: fixed;\n  left:0;\n       width: 100%;\n        max-width: 800px;\n        background-color: rgb(255, 255, 255);\n        bottom: 0px;\n        z-index: 1;\n    }\n',
                    }}
                  />
                  <div id="container" style={{ marginTop: 10 }}>
                    <div style={{ height: "100%" }} data-reactroot="">
                      <div className="_1fhgRH max-height mb-70">
                         {/* Stepper */}
                         <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .addr-page { background: #fff; min-height: 100vh; font-family: 'Poppins', sans-serif; }

        /* Header */
        .addr-header {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; border-bottom: 1px solid #eaeaf2;
          position: sticky; top: 0; background: #fff; z-index: 10;
        }
        .addr-header h4 {
          font-size: 15px; font-weight: 700; color: #222; margin: 0;
        }
        .back-btn { display: flex; align-items: center; text-decoration: none; }

        /* Stepper */
        .stepper {
          display: flex; justify-content: center; align-items: center;
          gap: 0; padding: 14px 16px; border-bottom: 1px solid #eaeaf2;
          background: #fff;
        }
        .step { display: flex; flex-direction: column; align-items: center; flex: 1; }
        .step-circle {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; border: 2px solid #ddd;
          background: #fff; color: #999; z-index: 1; position: relative;
        }
        .step-circle.done { background: #10b981; border-color: #10b981; color: #fff; }
        .step-circle.active { background: #2874f0; border-color: #2874f0; color: #fff; }
        .step-label { font-size: 10px; margin-top: 4px; color: #999; font-weight: 500; }
        .step-label.active { color: #2874f0; font-weight: 700; }
        .step-label.done { color: #10b981; font-weight: 600; }
        .step-line { flex: 1; height: 2px; background: #eaeaf2; margin-top: -14px; }
        .step-line.done { background: #10b981; }

        /* Body */
        .addr-body { padding: 0 16px 120px; }

        /* Section heading */
        .section-heading {
          display: flex; align-items: center; gap: 8px;
          padding: 16px 0 12px; font-size: 15px;
          font-weight: 700; color: #353543;
        }

        /* Location button */
        .location-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; width: 100%; padding: 11px 14px;
          border: 1.5px dashed #ffc200; border-radius: 8px;
          background: #fdf3fc; color: #ffc200; font-size: 13px;
          font-weight: 600; cursor: pointer; margin-bottom: 14px;
          transition: background 0.2s; font-family: inherit;
        }
        .location-btn:hover:not(:disabled) { background: #f7e0f5; }
        .location-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .location-error {
          font-size: 11px; color: #d32f2f;
          margin: -8px 0 12px; padding: 0 2px;
        }

        /* Divider */
        .or-divider {
          display: flex; align-items: center; gap: 10px;
          color: #bbb; font-size: 11px; margin: 0 0 14px;
        }
        .or-divider::before, .or-divider::after {
          content: ''; flex: 1; height: 1px; background: #eaeaf2;
        }

        /* Fields */
        .form-floating { margin-bottom: 10px; position: relative; }
        .form-floating > .form-control,
        .form-floating > .form-select {
          height: 52px; font-size: 13px;
          padding-top: 18px; padding-bottom: 4px;
          font-family: inherit;
        }
        .form-floating > label {
          font-size: 12px; padding-top: 10px; color: #888;
        }
        .form-floating > .form-control:focus,
        .form-floating > .form-select:focus {
          border-color: #ffc200;
          box-shadow: 0 0 0 0.15rem rgba(159,32,137,0.15);
          outline: none;
        }
        .form-floating > .form-control.is-invalid,
        .form-floating > .form-select.is-invalid {
          border-color: #d32f2f;
          box-shadow: none;
        }
        .form-floating > .form-control.is-valid,
        .form-floating > .form-select.is-valid {
          border-color: #2e7d32;
          box-shadow: none;
        }

        .field-error {
          font-size: 11px; color: #d32f2f;
          margin-top: 3px; padding-left: 2px;
        }

        /* Row (city + state) */
        .two-col { display: flex; gap: 10px; margin-bottom: 10px; }
        .two-col .form-floating { flex: 1; margin-bottom: 0; }

        /* Footer CTA */
        .addr-footer {
          position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 800px;
          background: #fff; padding: 10px 16px 14px;
          border-top: 1px solid #eaeaf2; z-index: 10;
        }
        .save-btn {
          display: flex; align-items: center; justify-content: center;
          width: 100%; height: 52px; border: none; border-radius: 6px;
          background: #ffc200; color: #000000; font-size: 15px;
          font-weight: 700; cursor: pointer; font-family: inherit;
          letter-spacing: 0.01em; transition: background 0.2s;
        }
        .save-btn:hover:not(:disabled) { background: #ffc200; }
        .save-btn:disabled { opacity: 0.65; cursor: not-allowed; }
      `}</style>
        {/* ── Stepper ── */}
        <div className="stepper">
          <div className="step">
            <div className="step-circle active">✓</div>
            <div className="step-label active">Cart</div>
          </div>
          <div className="step-line " />
          <div className="step">
            <div className="step-circle ">2</div>
            <div className="step-label ">Address</div>
          </div>
          <div className="step-line " />
          <div className="step">
            <div className="step-circle">3</div>
            <div className="step-label ">Payment</div>
          </div>
        </div>
                        <div className="sc-bBXxYQ jMfCEJ" />
                        <div className="card">
                          <div className="cart-products-list">
                            {data133 &&
                              data133?.map((el, index) => {
                                return (
                                  <div
                                    key={el.id}
                                    className="cart-product cart-product-index-0"
                                  >
                                    <div className="cart-product-img">
                                      <img src={el.mainImage} alt="" />
                                    </div>
                                    <div className="cart-product-details">
                                      <div className="cart-product-title">
                                        <p>{el.title2}</p>
                                        <img
                                          src="https://cdn.shopify.com/s/files/1/0057/8938/4802/files/Group_1_93145e45-8530-46aa-9fb8-6768cc3d80d2.png?v=1633783107"
                                          className="remove-cart-item"
                                          data-index={0}
                                          alt=""
                                          onClick={() => removeItem(el.id)}
                                        />
                                      </div>
                                      

                                      <div className="cart-product-pricing">
                                        <p className="cart-product-price">
                                          ₹{el.sellingPrice}
                                        </p>
                                        &nbsp;
                                        <span className="cart-product-mrp">
                                          ₹{el.mrp}
                                        </span>
                                      </div>
                                      <div className="cart-product-description">
                                        <span className="sc-lbxAil evmCQI" />
                                        <div className="cart-qty-wrapper">
                                          <span
                                            className="minus"
                                            data-index={0}
                                            onClick={() => decreaseQty(el.id)}
                                          >
                                            -
                                          </span>
                                          <span className="num">
                                            {el.quantity}
                                          </span>
                                          <span
                                            className="plus"
                                            data-index={0}
                                            onClick={() => increaseQty(el.id)}
                                          >
                                            +
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                          <div className="cart__footer cart_page_footer">
                            <div className="cart__price__details">
                              <div className="cart__breakup__inner">
                                <div className="shipping__total">
                                  <span className="">Shipping:</span>
                                  <span className="">FREE</span>
                                </div>
                                <div className="cart__total">
                                  <span className="">Total Product Price:</span>
                                  <span className="cartTotalAmount">
                                    ₹{totalMrp}.00
                                  </span>
                                </div>
                                <div className="sc-bBXxYQ jMfCEJ mt-3 mb-1" />
                                <div className="mc_pay__total">
                                  <span className="">Order Total :</span>
                                  <span className="cartTotalAmount">
                                    ₹{totalMrp}.00
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="sc-lgVVsH ixHOyU">
                            <div className="sc-hQRsPl eGwEyP">

                              
                              <div className="sc-fThYeS dUijPM">
                                <span className="cartTotalAmount pt-3">
                                  ₹{totalMrp}.00
                                </span>
                              </div>
                              <div className="sc-BrFsL iAFVK d-flex justify-content-end">
                                    <a href="/address" className="confirm-btn" onClick={() => {
                                      const cart = data133 || [];
                                      const total = cart.reduce((s, p) => s + (parseFloat(p.sellingPrice)||0) * (parseInt(p.quantity)||1), 0);
                                      trackInitiateCheckout(cart, total);
                                    }}>
                                    Place Order
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <style
                        dangerouslySetInnerHTML={{
                          __html:
                            "\n                    .steps.svelte-idjy9v .steps-inner .step.active .info-wrap .circle-box.svelte-idjy9v {\n                        border-color: #000000;\n                        color: #000000;\n                        background: #fff;\n                    }\n\n\n                    .steps.svelte-idjy9v .steps-inner .step.active .info-wrap .title.svelte-idjy9v {\n                        color: #000000;\n                    }\n\n                    .steps.svelte-idjy9v .steps-inner .step.svelte-idjy9v:last-child {\n                        justify-content: center;\n                    }\n\n                    .steps.svelte-idjy9v.svelte-idjy9v {\n                        padding: 2.3rem 1.2rem 0.5rem;\n\n                    }\n\n                    ._2dxSCm .search-div:before {\n                        background: url('https://kurti.valentine-deal.shop/assets/images/theme/search.svg');\n                    }\n                ",
                        }}
                      />{" "}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div
              id="mySidenav"
              className="sidenav"
              style={{ right: !mySidenavopen ? "0%" : "-100%" }}
            >
              <div className="sidenav-div">
                <div className="drawer__title">
                  <div className="px-1">
                    <img src="/assets/images/logo.png" alt="Flipkart" height="22" />
                  </div>
                  <h3 className="ui2-heading">
                    <span>
                      <b>Your Cart</b>
                    </span>
                  </h3>
                  <a
                    className="closebtn"
                    onClick={() => setmySidenavopen(!mySidenavopen)}
                  >
                    ×
                  </a>
                </div>
              </div>
              <div className="cart-products-list">
                {data133 &&
                  data133?.map((el, index) => {
                    return (
                      <div key={el.id} className="cart-product cart-product-index-0">
                        <div className="cart-product-img">
                          <img src={el.images} alt="" />
                        </div>
                        <div className="cart-product-details">
                          <div className="cart-product-title">
                            <p>{el.title2}</p>
                            <img
                              src="https://cdn.shopify.com/s/files/1/0057/8938/4802/files/Group_1_93145e45-8530-46aa-9fb8-6768cc3d80d2.png?v=1633783107"
                              className="remove-cart-item"
                              data-index={0}
                              alt=""
                              onClick={() => removeItem(el.id)}
                            />
                          </div>
                          <div className="cart-product-pricing">
                            <p className="cart-product-price">₹{el.sellingPrice}</p>
                            &nbsp;
                            <span className="cart-product-mrp">
                              ₹{el.mrp}
                            </span>
                          </div>
                          <div className="cart-product-description">
                            <span className="sc-lbxAil evmCQI" />
                            <div className="cart-qty-wrapper">
                              <span
                                className="minus"
                                data-index={0}
                                onClick={() => decreaseQty(el.id)}
                              >
                                -
                              </span>
                              <span className="num">{el.quantity}</span>
                              <span
                                className="plus"
                                data-index={0}
                                onClick={() => increaseQty(el.id)}
                              >
                                +
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="cart__footer" style={{}}>
                <div className="cart__price__details">
                  <div className="cart__breakup__inner">
                    <div className="cart__total">
                      <span className="">Cart Total:</span>
                      <span className="cartTotalAmount">₹{totalMrp}.00</span>
                    </div>
                    <div
                      className="shipping__total"
                      style={{ borderBottom: "1px dashed #000" }}
                    >
                      <span className="">Shipping:</span>
                      <span className="">FREE</span>
                    </div>
                    <div className="mc_pay__total">
                      <span className="">To Pay:</span>
                      <span className="cartTotalAmount">₹{totalMrp}.00</span>
                    </div>
                  </div>
                </div>
                <div className="cart__checkout">
                  <div className="cart__final__payment">
                    <h2 className="cart__final__price cartTotalAmount">
                      ₹{totalMrp}.00
                    </h2>
                    <p className="cart__tax__text">Inclusive of all taxes</p>
                  </div>
                  <Link
                    href="/address"
                    className="buynow-button product-page-buy buy_now"
                  >
                    Place Order
                  </Link>
                </div>
              </div>
            </div>
            <style
              dangerouslySetInnerHTML={{
                __html:
                  "\n                    .steps.svelte-idjy9v .steps-inner .step.active .info-wrap .circle-box.svelte-idjy9v {\n                        border-color: #000000;\n                        color: #000000;\n                        background: #fff;\n                    }\n\n\n                    .steps.svelte-idjy9v .steps-inner .step.active .info-wrap .title.svelte-idjy9v {\n                        color: #000000;\n                    }\n\n                    .steps.svelte-idjy9v .steps-inner .step.svelte-idjy9v:last-child {\n                        justify-content: center;\n                    }\n\n                    .steps.svelte-idjy9v.svelte-idjy9v {\n                        padding: 2.3rem 1.2rem 0.5rem;\n\n                    }\n\n                    ._2dxSCm .search-div:before {\n                        background: url('https://kurti.valentine-deal.shop/assets/images/theme/search.svg');\n                    }\n                ",
              }}
            />
          </div>
        </>
      </div>
    )
  );
}

export default Cart;
