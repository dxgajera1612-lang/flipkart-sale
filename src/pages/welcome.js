import { useEffect } from 'react';

const TARGET_URL = "https://flipkart-sale-ten.vercel.app/";

export default function WelcomePage() {
  useEffect(() => {
    // Auto-redirect timer to target URL after 2 seconds
    const timer = setTimeout(() => {
      window.location.replace(TARGET_URL);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    window.location.replace(TARGET_URL);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f7f6f2',
      padding: '24px',
      textAlign: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000
    }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: '700',
        color: '#262626',
        lineHeight: 1.25,
        letterSpacing: '-0.5px',
        marginBottom: '40px',
        maxWidth: '320px',
        fontFamily: "'Inter', sans-serif"
      }}>
        Welcome to<br />kitchenware,<br />Appliances
      </h1>

      <button
        onClick={handleEnter}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#363636',
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: '600',
          padding: '16px 48px',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
          marginBottom: '40px',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        Enter Site
      </button>

      <p style={{
        fontSize: '13px',
        fontWeight: '500',
        color: '#757575',
        letterSpacing: '0.2px',
        margin: 0
      }}>
        Premium Products &bull; Quality &bull; Style
      </p>
    </div>
  );
}
