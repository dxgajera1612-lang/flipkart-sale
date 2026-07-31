import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Sidenav from './Sidenav';

function Home() {
  const initialTime = 700;
  const [time, setTime] = useState(initialTime);
  const [mySidenavopen, setmySidenavopen] = useState(!true);
  const [data133, setdata133] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const cartItemCount = data133.reduce((count, item) => count + (parseInt(item?.quantity, 10) || 1), 0);

  // ✅ ALL scroll state lives in refs — zero stale closure issues
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const isLoadingRef = useRef(false);
  const loadMoreRef = useRef(null);

  // Load cart
  useEffect(() => {
    const loadCart = () => {
      try {
        const data1 = JSON.parse(localStorage.getItem("cart") || '[]');
        setdata133(data1);
      } catch { setdata133([]); }
    };
    loadCart();
    window.addEventListener('storage', loadCart);
    return () => window.removeEventListener('storage', loadCart);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => prev <= 10 ? 700 : prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ✅ fetchProducts — reads refs, never stale, stable reference
  const fetchProducts = useCallback(async (pageNum, append) => {
    if (isLoadingRef.current) return;
    if (!hasMoreRef.current && append) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers = { "Accept": "*/*", "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/products?page=${pageNum}&limit=20&isActive=true`, {
        method: 'GET', headers, credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      if (data.data && Array.isArray(data.data)) {
        if (append) {
          setProducts(prev => {
            const ids = new Set(prev.map(p => p._id || p.id));
            const fresh = data.data.filter(p => !ids.has(p._id || p.id));
            return [...prev, ...fresh];
          });
        } else {
          setProducts(data.data);
        }
        // ✅ Update ref immediately so observer always sees fresh value
        hasMoreRef.current = data.pagination?.hasNext === true;
        setTotalProducts(data.pagination?.total || 0);
      } else {
        hasMoreRef.current = false;
      }
    } catch (err) {
      console.error('Fetch error:', err);
      hasMoreRef.current = false;
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, []); // ✅ empty deps — only uses refs and setters

  // ✅ Observer set up ONCE on mount — never re-created
  // Because it reads refs (not state), it always has current values
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&        // ✅ ref — always fresh
          !isLoadingRef.current        // ✅ ref — always fresh
        ) {
          pageRef.current += 1;        // ✅ increment ref
          fetchProducts(pageRef.current, true);
        }
      },
      { root: null, rootMargin: '300px', threshold: 0.1 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, []); // ✅ empty deps — runs once, never disconnects mid-scroll

  // Initial load
  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    fetchProducts(1, false);
  }, []);

  return (
    <>
      <div id="container" style={{ overflow: 'hidden' }}>
        <div style={{ height: '100%' }} data-reactroot="">
          <div>
            {/* Header */}
            <header className="store-header">
              <div className="store-header__top">
                <button type="button" className="header-icon-button" aria-label="Open menu">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
                </button>
                <Link href="/" className="store-brand" aria-label="Flipkart home">
                  <img src="/assets/images/logo.png" alt="Flipkart" />
                </Link>
                <button
                  type="button"
                  className="header-cart-button"
                  onClick={() => setmySidenavopen(true)}
                  aria-label={`Open cart, ${cartItemCount} items`}
                  aria-expanded={mySidenavopen}
                >
                  <img src="/assets/images/shoppings.png" alt="" />
                  {cartItemCount > 0 && <span className="header-cart-count">{cartItemCount > 99 ? '99+' : cartItemCount}</span>}
                </button>
              </div>
              <label className="store-search" htmlFor="home-search">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
                <input id="home-search" type="search" placeholder="Search for products, brands and more" />
              </label>
            </header>


            {/* Cart Sidebar */}
            <Sidenav mySidenavopen={mySidenavopen} setmySidenavopen={setmySidenavopen} data133={data133} setdata133={setdata133} />

          
              <div className="bg-white overflow-x-auto no-scrollbar shadow-sm">
  <div className="flex pl-0 p-3 py-0.5 min-w-max space-x-1">
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,UklGRs4FAABXRUJQVlA4IMIFAABQIwCdASqXAI8APrVSoU4qpqQjJhaa2VAWiWVu3V9XHVkv4M6xV//Uq70BkJPm3ss50/0ooO9m78u1b/md74yr/uvCm1d1Z+gB4oWe36x9gr9c+tuV7AcpHFMgNky98xRJDzPC5zZRLGwB1LJpo1/1/uYWF3qYLEeutixXLh4oLJtLNgkZ2p/YxB/HSmsmGBzNrVB5PO7+hEheq66VFHWGGcMQ7FVpNZ0m74lbXrtv6hr1EIZfoYR0y240NQSPrAnvIxPd2sA+9kXk3iftHm7LbNe/NRyPD47HvM0Bj5tP43Cn1LEmy8+GQv27LwSh0htmUE8udc53DCDhtyVeukg29DHsKp7GzIoR866aZUkNYKaCPvCYVXb7/9OzoFoBOdluiYAA/vlYTp2wvOETJ+scHv/S9sYKLjlLn5X8zv76J7xepR3AY5+EJgU1LjlwAmqTQegYscKFZ2AMNJFQ+EM9eJbdQ/onwGKHuIKZQjkKtReebRJKP1NlnXaYkX5uCzjtt7Ri1hyqy0yQpEgSnumulTHi9NsPdT3ML0vOSZOgUnStxNDy06/N3SG7D3yVa/PYEd1bAoaw4DUXuewW89F+WlJCssVX+UCs0MrCD1r3y2XDEhXNo+n1ufd9Z6DUa70tV7xWtF25dTqSMH9+LaEzZ7ZWO/hVmYkMIirCFvUHazabW3k+yknjmsFoSn+TtEgGHI0Z41gPba1iDS7zJyr94mpYEsL0T/rw95mL9GJnq5taIjB97kStnTdk/mw7B7O/zylh3HJdMn2dCrscd/GRUyQhGCxlsoDoyg41yWHUOsxss2K3bXLI6YAfCpjjDqFEtVQ8er7LpOclyjdiM/aA/J4CpbONLQLWjAatNPJrcxwPQq6dwA4u860oO4nPXH2hbj6zrn5omLi40TpDrUWcW5ZcY5BiKEwJL+NlAtPw93QiPYYDGPjx19L3Ipjoad2hVVLaa035vIv6mPIdv3ODFEY56XgahIL1BXZ37SCkUd0eM7RiKcTupkwzdQ+AS+8Etw2Ofzwh8BjwzD00mgxfuAsIEm36CLsAe9iWkH/IDdYsEIedQPyC7A6kNs1sZHCjfZC+DUtihwuy3s2X4oty9b1CZiL2IMmECAEG6tVMWYtaGhssLNrtatFKk/lUeqP933IXTKecplkYd3Uu5ZITmu2XMK3pCWep0lDBfpY972erMamng3AgSe5HCj4dWY+yRISVwZNwY/6SZPdrBg0J91n6OZFcqHup4+1zPqwrxOmdynMKl4FFzAyGohSXFSff+lJ+5/Q/je0t0rP2Ga5qLmKn/rmjxz0p1mep2eAS90UQILOHRY8GwnbBvFPDSbzQfyS0VQ86/g/sRiwnI1tfxsK8gcKmJPoz+YI5av6cf0ed/FPvJZ3gmiNNrrtMwnqOUIkzZ2RO2QjYvjrQqGxorX5XHZ035ttxcb59AcXvLMR0qU9hJZTIrw7YWn/2Q+5reDGO8NzWe7OnwTKUXsB5TqfwrZH2aEk1OulyozLvv9/ZDWrgV3Gn7CmiMjL5wNT3BQu1mac8h1gU+K7+KiCbvf4ly26QwozyDjnemb9EvAStonIjpUhkYi4X1zeIvT464T0ZSYXbiFBfxmux9t/zXfMxbGouBlU/pi1znfqoo8vMXHioPdSO+HuBL+zfKWG9R8apjoRJiUHnDRJFkYqZbE/yfwDzOkFULPchFnw58CtqC9l8TRmS33qTxOwa99XBcPLWZvX8in3Vz+5GDkWvoD+B2fRYTG6v+3Tkaqs/km9VJW5krpccsMoE0IhsytDf924f8CH3a8nRJRGF3Q5sTNfinN4tZnx1RM+jvqeujs1i6GXFAt48D/HnJeaUr097efIb6/nz/amn4Gjip04cGIREUcHyDUFw2+jr9oAvgu8DWGUbJlkr88C6RsgCp3F1bb0OuVxceYIsGcjY7AyLDfmbhGfxV/2Cwvp29KyFAAAA"
          alt="Categories"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Offer Zone"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,UklGRsoEAABXRUJQVlA4IL4EAADQGwCdASqXAI8APrVSo0wqpyUiqxSqcVAWiWMA1315iOOmzU63jZYFf5KcO/ze2kY5fRF0Cd5fbu7EvWa00yGsw2MuF1mSgM82jxHODte1NiOD28zjTTkhjGqU2nvSgCoGVamQs/2wKNKlQaXFcnn1QIiJ6jzugH8ZNJWMpbEc0xUJXvlNekk2pZ9Txc2GTbr1ICOVmxsktPjbULl3fvUcP9+XOB5CkXvX/HBA0oltiNo9my371V25krm2YFVG6avzP0of8X4SBSxoOjpOC8TfLIUh/DDKx5YRvYwzVfudhqCQcqQ6gAAA/vikAAT3Gt/HvSm2D8t0atNbio8hBAon1NKgcJajWi7r44JWhZDfiN5aiJXjNVVS3qH8eOqnAfMo4xabQicxBcQa5LRtq0VfiN4S1D8aUFq9HXwaVg+ujfZYV1N8ZKhlE2/N5m58WymCbNz/rm09zuu7W8hqY5Cdrvs+3tzWOv471IJOD/YW6r+Hwhy7ZgphuVgPcG41w6sYaNSk3egfKJmSkR0NPIioI24sPK8V8bqglr89unHj8cmfZIieJm8yNbpDuWOL1mb27qhkCXWGOYDHtswcN0g05iNNO6BAYG6TAWGZqM3NGIFoeYVGGlU0lADiqCYnI6cH3IbByVwhGsagd8eQkXryQ+YBR6rcC8W6QySMsfATp3jVRj1IqQPUuqOKA/6rG+61LE/z9iPmyFjeB/YKVUUWOzRPyO81w0HILEYhznAPXlL4KeSlRGfo3GXYF1vH+9DhL2/z0s4ZztqG1Fj1zscOUjC++7fq4TzF5BRK53u5B8pJSi73Gp/7bkqdtE7cja7M3a+2YmWYuJ5r3OUAwvJpVNv6m8QgCIME/UkDWyKJO2gGld+BJw6QgtEn0N5OxsZzL/Apw1deaWCNUSilbnygwnxMsKWMy5RyJi+SZdYxhF8Q8jQg4xTOEQDKwUpDAyOsi8D9KBUCL/0DbKPIaSaymN+p6A8z6Eth0Fc3qw+LQwOFNPCrYSRFK/c3xjDbi/Gek/4wSUjdv6lf6TuvVXV0N7rP4H2LEqQIdX8PnBTZrWDXEGmndtq1/0uYcm7BPWP6WAP8a1f915qwMfdxMqAUO5uG4n7XuvdhIV7zmY/2eMKWnkSheOPwht+14tD00nDJia+SvfKgTjh0vKTESyiEBHZBTSMUPLh7mYH3rcZnFO2/QvxVrVNvN4J0e1uf/ywGN0t3XWSw+Zq/b6Pd1MwyZpBzLWQMJZzI+VRxrFjxSL/z8RI/Vg3/Do/ZhVZhCb3HjTtpXnv+OE0Gdt7E8pA/XgXVLfmRHfk/3WfYXf7ss4jibTSYc8p6cbFvpZX1f9w6g45r/5BwbkH3zc7db/v39jUNNXGFz+iHpfcSeQ54xhkgiNWf5bQ12OZU+yZQels/Pjf4avO060C+Gc9sn8nU8gS3Tt7ecYOk/jllsd+Km3vxCRqYKTknneWL8gUWatbO/toPxt5BhOgMdVSCyxEVUNn5mdAQQXI/zM8B9cyKHhrdjajY3IEAmGuA6YUp979Gv4xV6lUxR1fjYNsR3nosqI1qTXxp4r/c0I6GOHivxInXAOg0xtUd/XA2nIWydPbszIya4i5kvnMPuEAAAA=="
          alt="Mobiles"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Fashion"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Electronics"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Appliances"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Home"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Personal Care"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Toys & Baby"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Furniture"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Flights & Hotel"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Sports"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Insurance"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
    <div className="flex flex-col items-center justify-start min-w-[64px] cursor-pointer group">
      <div className="w-16 h-16 mb-1 overflow-hidden transition-transform transform">
        <img
          src="data:image/webp;base64,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"
          alt="Gift Cards"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  </div>
</div>


            <section className="">
              <img src="/bn1.jpg" alt="Bank Offer" className="fk-home-banner" />
              <div className="fk-deal-bar">
                <div>
                  <strong>Deals of the Day</strong>
                  <span>◷ {Math.floor(time / 60)}:{String(time % 60).padStart(2, '0')}</span>
                </div>
                <span className="fk-sale-live">SALE IS LIVE</span>
              </div>
            </section>

            {/* Styles */}
            <style dangerouslySetInnerHTML={{
              __html: `
                .product_loader { border: 7px solid #f3f3f3; border-top: 7px solid #ffc200; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 100px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .menu { -webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; padding: 10px 0; --marquee-width: 100vw; --offset: 20vw; --move-initial: calc(-25% + var(--offset)); --move-final: calc(-50% + var(--offset)); --item-font-size: 10vw; counter-reset: menu; background: #970e71; }
                .marquee { width: var(--marquee-width); overflow: hidden; pointer-events: none; }
                .marquee__inner { width: fit-content; display: flex; position: relative; transform: translate3d(var(--move-initial), 0, 0); animation: marquee 5s linear infinite; animation-play-state: running; opacity: 1; transition: opacity 0.4s; }
                .marquee span { text-align: center; white-space: nowrap; font-size: 18px; padding: 0 1vw; font-weight: 900; line-height: 1.15; color: #ffffff; }
                @keyframes marquee { 0% { transform: translate3d(var(--move-initial), 0, 0); } 100% { transform: translate3d(var(--move-final), 0, 0); } }

                /* ✅ Skeleton loader shimmer animation */
                @keyframes shimmer {
                  0% { background-position: -400px 0; }
                  100% { background-position: 400px 0; }
                }
                .skeleton-card {
                  width: calc(50% - 8px);
                  margin: 4px;
                  border-radius: 8px;
                  overflow: hidden;
                  background: #fff;
                  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
                }
                .skeleton-img {
                  width: 100%;
                  height: 180px;
                  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                  background-size: 800px 100%;
                  animation: shimmer 1.4s infinite linear;
                }
                .skeleton-line {
                  height: 12px;
                  margin: 8px 10px 6px;
                  border-radius: 6px;
                  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                  background-size: 800px 100%;
                  animation: shimmer 1.4s infinite linear;
                }
                .skeleton-line.short { width: 60%; height: 10px; }
                .skeleton-line.xshort { width: 40%; height: 10px; margin-bottom: 12px; }
              `
            }} />
            <style
              dangerouslySetInnerHTML={{
                __html:
                  "\n                    .steps.svelte-idjy9v .steps-inner .step.active .info-wrap .circle-box.svelte-idjy9v {\n                        border-color: #000000;\n                        color: #000000;\n                        background: #fff;\n                    }\n\n\n                    .steps.svelte-idjy9v .steps-inner .step.active .info-wrap .title.svelte-idjy9v {\n                        color: #000000;\n                    }\n\n                    .steps.svelte-idjy9v .steps-inner .step.svelte-idjy9v:last-child {\n                        justify-content: center;\n                    }\n\n                    .steps.svelte-idjy9v.svelte-idjy9v {\n                        padding: 2.3rem 1.2rem 0.5rem;\n\n                    }\n\n                    ._2dxSCm .search-div:before {\n                        background: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E\") no-repeat center;\n                    }\n                ",
              }}
            />
          </div>
        </div>
      </div>
      <div className="product-list d-flex" style={{ minHeight: '300px', flexWrap: 'wrap' }}>
        {loading && products.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '60px 20px', minHeight: '300px' }}>
            <div style={{ width: '42px', height: '42px', border: '3.5px solid #e2e8f0', borderTop: '3.5px solid #2874f0', borderRadius: '50%', animation: 'fkSpin 0.7s linear infinite' }} />
            <span style={{ marginTop: '14px', fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: 700, color: '#2874f0' }}>Loading Products...</span>
            <style jsx>{`
              @keyframes fkSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </div>
        )}

        {/* Product cards */}
        {products.map((el, index) => {
          const productId = el._id || el.id;
          const title = el.title || el.title2 || 'Product';
          const price = el.price || el.selling_price || el.sellingPrice || 0;
          const mrp = el.mrp || el.cancelprice || 0;
          const discount = el.discount || el.dicPersent || '';
          const image = el.image || el.mainImage || (el.images && el.images[0]) || '';

          return (
            <Link
              key={`${productId}-${index}`}
              href={`/product/${productId}`}
              className="product-card"
            >
              <div className="product-img">
                <img
                  src={image}
                  alt={title}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="product-details">
                <h3 className="product-name">{title}</h3>
                <div className="product-price">
                  <span className="sell-price">₹{price}</span>
                  {mrp > price && (
                    <>
                      <span className="mrp-price line-through">₹{mrp}</span>
                      {discount && <span className="off-percentage m-2">{discount}%</span>} 
                    </>
                  )}
                </div>
                <span className="NewProductCardstyled__OfferPill-sc-6y2tys-31 iMEkWH">
                  <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" width={12} height={12}>
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 6A6 6 0 1 1 0 6a6 6 0 0 1 12 0ZM5.168 9.008l.8.17L3.554 6.49l-.005-.75h1.298c.383 0 .687-.076.91-.228.225-.152.375-.352.45-.6h-2.76l.261-.892h2.478c-.167-.507-.62-.76-1.36-.76h-1.38l.277-1h4.834l-.262.897H7.176c.174.245.287.533.338.863h1.037l-.257.891H7.52c-.076.54-.301.952-.678 1.238-.376.286-.908.457-1.596.512L6.88 8.493l.064-.826a.41.41 0 0 1 .437-.375.403.403 0 0 1 .373.436L7.59 9.88l-.004.012-.004.013a.42.42 0 0 1-.03.104l-.001.005a.263.263 0 0 1-.017.037.288.288 0 0 1-.011.031c-.018.026-.039.045-.06.065a.07.07 0 0 0-.006.008c-.004.004-.007.009-.013.012a.433.433 0 0 1-.12.068.417.417 0 0 1-.155.023c-.005.002-.01.003-.015.002-.019-.002-.037-.006-.054-.01l-2.102-.445a.407.407 0 0 1 .17-.797Z" fill="#219653" />
                  </svg>
                  <span style={{ fontSize: 10, color: 'green' }}>Special Offers Available</span>
                </span>
                <p className="free-delivery">Free Delivery</p>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ background: '#4caf50', color: '#fff', borderRadius: 4, padding: '2px 5px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
                    4.5
                    <svg width={8} height={8} viewBox="0 0 20 20" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.5399 6.85L13.6199 5.5L10.5099 0.29C10.3999 0.11 10.2099 0 9.99993 0C9.78993 0 9.59993 0.11 9.48993 0.29L6.37993 5.5L0.45993 6.85C0.25993 6.9 0.0899297 7.05 0.0299297 7.25C-0.0300703 7.45 0.00992969 7.67 0.14993 7.83L4.13993 12.4L3.58993 18.44C3.56993 18.65 3.65993 18.85 3.82993 18.98C3.99993 19.1 4.21993 19.13 4.41993 19.05L9.99993 16.64L15.5799 19.03C15.6599 19.06 15.7399 19.08 15.8099 19.08C16.1199 19.09 16.4199 18.82 16.4199 18.48C16.4199 18.42 16.4099 18.36 16.3899 18.31L15.8499 12.38L19.8399 7.81C19.9799 7.65 20.0199 7.43 19.9599 7.23C19.9099 7.04 19.7399 6.89 19.5399 6.85Z" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>(6728)</span>
                </div>
              </div>
            </Link>
          );
        })}

        {/* ✅ Sentinel div — ALWAYS rendered, observer watches this */}
        <div ref={loadMoreRef} style={{ width: '100%', height: '10px' }} />

        {/* Flipkart spinner loader while loading more */}
        {loading && products.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '24px 0' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTop: '3px solid #2874f0', borderRadius: '50%', animation: 'fkSpin 0.7s linear infinite' }} />
          </div>
        )}

        {/* All products loaded */}
        {!loading && products.length > 0 && !hasMoreRef.current && (
          <div style={{ width: '100%', textAlign: 'center', padding: '20px', color: '#666', fontSize: 14 }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>🎉 You've seen all products!</p>
            <p>{totalProducts} total products</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && products.length === 0 && (
          <div style={{ width: '100%', textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#999', fontSize: 16 }}>No products found</p>
            <button
              onClick={() => {
                pageRef.current = 1;
                hasMoreRef.current = true;
                fetchProducts(1, false);
              }}
              style={{ marginTop: 20, padding: '10px 30px', background: '#2874f0', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default Home;
