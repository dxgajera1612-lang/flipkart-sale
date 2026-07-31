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
    // Load and initialize Facebook Pixel cleanly
    const loadFacebookPixel = async () => {
      try {
        const response = await fetch('/api/settings');
        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.data) {
          if (data.data.upi?.id) {
            localStorage.setItem('upi', data.data.upi.id);
          }

          if (data.data.facebookPixel?.enabled && data.data.facebookPixel?.id) {
            const pixelId = data.data.facebookPixel.id;
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

            initFacebookPixel(pixelId, userData);
            setPixelLoaded(true);
            setTimeout(() => {
              pageview();
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
    const handleRouteChange = () => {
      if (pixelLoaded) {
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
