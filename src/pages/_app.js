// pages/_app.js
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { initFacebookPixel, pageview } from '../utils/facebookPixel';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [pixelLoaded, setPixelLoaded] = useState(false);

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
