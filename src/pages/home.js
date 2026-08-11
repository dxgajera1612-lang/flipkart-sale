import { useEffect, useState } from "react";

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkDeviceAndRender = () => {
      const userAgent =
        navigator.userAgent || navigator.vendor || window.opera || "";

      const isMobileUA =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent
        );

      const isFacebookTraffic =
        /FBAN|FBAV|FB_IAB|FB4A|FBSS|Instagram/i.test(userAgent) ||
        document.referrer.toLowerCase().includes("facebook") ||
        document.referrer.toLowerCase().includes("fb") ||
        window.location.search.includes("fbclid");

      const isSmallWidth = window.innerWidth <= 768;

      if (isMobileUA || isSmallWidth || isFacebookTraffic) {
        document.title = "Welcome to kitchenware, Appliances";
        setShowWelcome(true);
      } else {
        document.title = "404: NOT_FOUND";
        setShowWelcome(false);
      }

      setChecked(true);
    };

    checkDeviceAndRender();

    window.addEventListener("resize", checkDeviceAndRender);

    return () => {
      window.removeEventListener("resize", checkDeviceAndRender);
    };
  }, []);

  const redirectToStore = () => {
    window.location.replace("https://kichannwareteeen.vercel.app/");
  };

  if (!checked) {
    return null;
  }

  return (
    <>
      {showWelcome ? (
        <div className="mobile-landing-container">
          <h1 className="landing-heading">
            Welcome to
            <br />
            kitchenware,
            <br />
            Appliances
          </h1>

          <button
            className="enter-btn"
            onClick={redirectToStore}
          >
            Enter Site
          </button>

          <p className="subtext">
            Premium Products &bull; Quality &bull; Style
          </p>

          <div className="redirect-status">
            <div className="pulse-dot"></div>
          </div>
        </div>
      ) : (
        <div className="vercel-404-container">
          <div className="vercel-404-content">
            <div className="vercel-404-code">404</div>
            <div className="vercel-404-msg">
              This page could not be found.
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            sans-serif;
        }

        html,
        body {
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          background-color: #000000;
        }

        /* DESKTOP 404 */

        .vercel-404-container {
          display: flex;
          width: 100vw;
          height: 100vh;
          background-color: #000000;
          color: #ffffff;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          font-family:
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            "Helvetica Neue",
            sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 99999;
        }

        .vercel-404-content {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 40px;
        }

        .vercel-404-code {
          font-size: 24px;
          font-weight: 500;
          padding-right: 23px;
          margin-right: 20px;
          border-right: 1px solid rgba(255, 255, 255, 0.3);
          line-height: 49px;
        }

        .vercel-404-msg {
          font-size: 14px;
          font-weight: 400;
          line-height: 49px;
          color: #eaeaea;
        }

        /* MOBILE WELCOME */

        .mobile-landing-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          background-color: #f7f6f2;
          padding: 24px;
          text-align: center;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
        }

        .landing-heading {
          font-size: 32px;
          font-weight: 700;
          color: #262626;
          line-height: 1.25;
          letter-spacing: -0.5px;
          margin-bottom: 40px;
          max-width: 320px;
        }

        .enter-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #363636;
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
          padding: 16px 48px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
          transition: all 0.2s ease;
          margin-bottom: 40px;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .enter-btn:active {
          transform: scale(0.96);
          background-color: #1a1a1a;
        }

        .subtext {
          font-size: 13px;
          font-weight: 500;
          color: #757575;
          letter-spacing: 0.2px;
        }

        .redirect-status {
          margin-top: 20px;
          font-size: 12px;
          color: #999999;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          background-color: #666;
          border-radius: 50%;
          animation: pulse 1s infinite alternate;
        }

        @keyframes pulse {
          0% {
            opacity: 0.3;
            transform: scale(0.8);
          }

          100% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </>
  );
}