// pages/_app.js
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { initFacebookPixel, pageview } from '../utils/facebookPixel';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [pixelLoaded, setPixelLoaded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallWidth = window.innerWidth <= 768;
      
      // If NOT mobile user agent AND width is > 768px (i.e. Desktop PC / Laptop)
      if (!isMobileUA && !isSmallWidth && !router.pathname.startsWith('/admin')) {
        setIsDesktop(true);
      } else {
        setIsDesktop(false);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [router.pathname]);

  useEffect(() => {
    // Load and initialize Facebook Pixel
    const loadFacebookPixel = async () => {
      try {
        const response = await fetch('/api/settings');

        if (!response.ok) {
          console.warn('Settings API not available');
          return;
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Store UPI ID if available
          if (data.data.upi?.id) {
            localStorage.setItem('upi', data.data.upi.id);
          }

          // Initialize Facebook Pixel if enabled
          if (data.data.facebookPixel?.enabled && data.data.facebookPixel?.id) {
            const pixelId = data.data.facebookPixel.id;
            console.log('Initializing Facebook Pixel:', pixelId);
            
            // Retrieve saved user details for Meta Advanced Matching
            let userData = {};
            try {
              const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
              if (savedUser) {
                userData = {
                  phone: savedUser.phone || '',
                  name: savedUser.name || '',
                  email: savedUser.email || '',
                };
              }
            } catch (_) {}

            // Initialize pixel with Advanced Matching parameters
            initFacebookPixel(pixelId, userData);
            
            // Mark pixel as loaded and track initial page view
            setPixelLoaded(true);
            
            // Track initial page view after a short delay to ensure pixel is ready
            setTimeout(() => {
              pageview();
              console.log('Facebook Pixel initialized successfully');
            }, 100);
          }
        }
      } catch (error) {
        console.error('Error loading Facebook Pixel:', error);
      }
    };

    loadFacebookPixel();
  }, []);

  useEffect(() => {
    // Track page views on route change (only if pixel is loaded)
    const handleRouteChange = (url) => {
      if (pixelLoaded) {
        console.log('Tracking page view:', url);
        pageview();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, pixelLoaded]);

  if (isDesktop) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000000',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 999999
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '49px' }}>
          <span style={{ fontSize: '24px', fontWeight: 500, paddingRight: '23px', marginRight: '20px', borderRight: '1px solid rgba(255, 255, 255, 0.3)', lineHeight: '49px' }}>
            404
          </span>
          <span style={{ fontSize: '14px', fontWeight: 400, lineHeight: '49px', color: '#eaeaea' }}>
            This page could not be found.
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default MyApp;
