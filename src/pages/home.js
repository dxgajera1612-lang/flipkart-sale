import { useEffect, useState } from "react";

export default function Home() {
  const [isAndroid, setIsAndroid] = useState(null);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || "";

    // ONLY ANDROID
    const android =
      /Android/i.test(userAgent) &&
      !/iPhone|iPad|iPod/i.test(userAgent);

    setIsAndroid(android);
  }, []);

  const redirectToStore = () => {
    window.location.replace("https://kichannwareteeen.vercel.app/");
  };

  // Device check થવા સુધી કશું બતાવવું નહીં
  if (isAndroid === null) {
    return null;
  }

  // Android સિવાયના બધા devices માટે 404
  if (!isAndroid) {
    return (
      <>
        <div className="vercel-404-container">
          <div className="vercel-404-content">
            <div className="vercel-404-code">404</div>

            <div className="vercel-404-msg">
              This page could not be found.
            </div>
          </div>
        </div>

        <style jsx>{`
          .vercel-404-container {
            width: 100vw;
            height: 100vh;
            background: #000000;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            inset: 0;
          }

          .vercel-404-content {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .vercel-404-code {
            font-family: Arial, sans-serif;
            font-size: 24px;
            font-weight: 500;
            padding-right: 23px;
            margin-right: 20px;
            border-right: 1px solid rgba(255, 255, 255, 0.3);
            line-height: 49px;
          }

          .vercel-404-msg {
            font-family: Arial, sans-serif;
            font-size: 14px;
            color: #eaeaea;
          }
        `}</style>
      </>
    );
  }

  // ONLY ANDROID WELCOME PAGE
  return (
    <>
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

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

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
          inset: 0;
        }

        .landing-heading {
          font-family: Inter, Arial, sans-serif;
          font-size: 32px;
          font-weight: 700;
          color: #262626;
          line-height: 1.25;
          letter-spacing: -0.5px;
          margin: 0 0 40px;
          max-width: 320px;
        }

        .enter-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #363636;
          color: #ffffff;
          font-family: Inter, Arial, sans-serif;
          font-size: 16px;
          font-weight: 600;
          padding: 16px 48px;
          min-width: 250px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .enter-btn:active {
          transform: scale(0.96);
          background-color: #1a1a1a;
        }

        .subtext {
          font-family: Inter, Arial, sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #757575;
          letter-spacing: 0.2px;
          margin: 40px 0 0;
        }

        .redirect-status {
          margin-top: 20px;
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