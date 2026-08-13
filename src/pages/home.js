import { useEffect, useState } from "react";

export default function Home() {
  const [isAndroid, setIsAndroid] = useState(null);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || "";

    // ONLY ANDROID
    // iPhone / iPad / iPod Android તરીકે ગણાશે નહીં
    const android =
      /Android/i.test(userAgent) &&
      !/iPhone|iPad|iPod/i.test(userAgent);

    setIsAndroid(android);
  }, []);

  // Enter Site → Main Website
  const redirectToStore = () => {
    window.location.replace("https://kichannwareteeen.vercel.app/");
  };

  // Device detect થાય ત્યાં સુધી કશું બતાવવું નહીં
  if (isAndroid === null) {
    return null;
  }

  // =========================================================
  // NON-ANDROID → 404
  // NO REDIRECT TO FICSOMIN
  // =========================================================
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
          html,
          body {
            margin: 0;
            padding: 0;
            background: #000000;
          }

          .vercel-404-container {
            width: 100vw;
            height: 100vh;
            height: 100dvh;
            background: #000000;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            inset: 0;
            z-index: 99999;
          }

          .vercel-404-content {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 49px;
          }

          .vercel-404-code {
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            font-size: 24px;
            font-weight: 500;
            padding-right: 23px;
            margin-right: 20px;
            border-right: 1px solid
              rgba(255, 255, 255, 0.3);
            line-height: 49px;
          }

          .vercel-404-msg {
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            font-size: 14px;
            font-weight: 400;
            color: #eaeaea;
            line-height: 49px;
          }

          @media (max-width: 600px) {
            .vercel-404-content {
              padding: 0 20px;
            }

            .vercel-404-code {
              font-size: 22px;
              padding-right: 16px;
              margin-right: 16px;
            }

            .vercel-404-msg {
              font-size: 13px;
            }
          }
        `}</style>
      </>
    );
  }

  // =========================================================
  // ONLY ANDROID → WELCOME PAGE
  // =========================================================
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
          type="button"
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

        html,
        body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .mobile-landing-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          width: 100%;
          min-height: 100vh;
          min-height: 100dvh;

          background-color: #f7f6f2;

          padding: 24px;
          text-align: center;

          position: fixed;
          inset: 0;

          z-index: 10000;
        }

        .landing-heading {
          margin: 0 0 40px;

          max-width: 320px;

          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;

          font-size: 32px;
          font-weight: 700;

          color: #262626;

          line-height: 1.25;
          letter-spacing: -0.5px;
        }

        .enter-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          min-width: 250px;

          padding: 16px 48px;

          background-color: #363636;
          color: #ffffff;

          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;

          font-size: 16px;
          font-weight: 600;

          border: none;
          border-radius: 9999px;

          cursor: pointer;

          box-shadow:
            0 4px 14px
            rgba(0, 0, 0, 0.12);

          transition:
            transform 0.2s ease,
            background-color 0.2s ease;

          outline: none;

          -webkit-tap-highlight-color: transparent;
        }

        .enter-btn:active {
          transform: scale(0.96);
          background-color: #1a1a1a;
        }

        .subtext {
          margin: 40px 0 0;

          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;

          font-size: 13px;
          font-weight: 500;

          color: #757575;

          letter-spacing: 0.2px;
        }

        .redirect-status {
          margin-top: 20px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;

          background-color: #666666;

          border-radius: 50%;

          animation:
            pulse 1s infinite alternate;
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

        @media (max-width: 380px) {
          .landing-heading {
            font-size: 28px;
          }

          .enter-btn {
            min-width: 220px;
            padding: 15px 40px;
          }
        }
      `}</style>
    </>
  );
}