// components/admin/AdminLayout.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  FiHome,
  FiPackage,
  FiSettings,
  FiUpload,
  FiMenu,
  FiX,
  FiLogOut,
  FiUser,
  FiCreditCard,
  FiChevronDown,
  FiShield,
  FiBell,
  FiHelpCircle,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Lazy load non-critical components
const UserMenu = dynamic(() => import('./UserMenu'), { ssr: false });

// Constants
const NAV_ITEMS = [
  { href: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
  { href: '/admin/products', icon: FiPackage, label: 'Products' },
  { href: '/admin/users', icon: FiUser, label: 'Users' },
  { href: '/admin/paytm-transactions', icon: FiCreditCard, label: 'Paytm Transactions' },
  { href: '/admin/bulk-upload', icon: FiUpload, label: 'Bulk Upload' },
  { href: '/admin/settings', icon: FiSettings, label: 'Settings' },
];

const SIDEBAR_WIDTH = 256; // 16rem = 256px
const MOBILE_BREAKPOINT = 1024;

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout, validateAuth } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedItems, setExpandedItems] = useState(new Set());
  const sidebarRef = useRef(null);
  const mainContentRef = useRef(null);

  // Memoize auth validation
  useEffect(() => {
    let mounted = true;
    
    const validate = async () => {
      if (mounted) {
        await validateAuth();
      }
    };
    
    validate();
    
    return () => {
      mounted = false;
    };
  }, [validateAuth]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/admin/login');
    }
  }, [isAuthenticated, loading, router]);

  // Handle window resize with debounce
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const mobile = window.innerWidth < MOBILE_BREAKPOINT;
        setIsMobile(mobile);
        setSidebarOpen(!mobile);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Close sidebar on route change for mobile
  useEffect(() => {
    const handleRouteChange = () => {
      if (isMobile) {
        setSidebarOpen(false);
      }
    };

    router.events?.on('routeChangeStart', handleRouteChange);
    return () => router.events?.off('routeChangeStart', handleRouteChange);
  }, [router.events, isMobile]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen, isMobile]);

  // Handle click outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isMobile &&
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !e.target.closest('.sidebar-toggle')
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, sidebarOpen]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await logout();
      toast.success('Logged out successfully', {
        icon: '👋',
        duration: 3000,
      });
      router.push('/admin/login');
    } catch (error) {
      toast.error('Failed to logout. Please try again.');
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, router, isLoggingOut]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const toggleExpanded = useCallback((href) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  }, []);

  // Memoize active route check
  const isActiveRoute = useCallback((href, exact = false) => {
    if (exact) {
      return router.pathname === href;
    }
    return router.pathname.startsWith(href);
  }, [router.pathname]);

  // Memoize nav items with active state
  const navItems = useMemo(() => NAV_ITEMS.map(item => ({
    ...item,
    isActive: isActiveRoute(item.href, item.exact || false),
  })), [isActiveRoute]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-label="Loading">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-600 border-t-transparent" />
          <p className="text-sm text-gray-500 font-medium">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:border focus:border-gray-300 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-50 h-screen transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white border-r border-gray-200 shadow-xl`}
        style={{ width: SIDEBAR_WIDTH }}
        role="navigation"
        aria-label="Admin sidebar"
        inert={!sidebarOpen}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <Link href="/admin" className="flex items-center gap-3 group" aria-label="Go to dashboard">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 transition-transform group-hover:scale-105">
                <span className="text-white font-bold text-lg" aria-hidden="true">⚙</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">Admin</h2>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </Link>
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-all"
              aria-label="Close sidebar"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.isActive;
                
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan-50 text-cyan-700 border-l-4 border-cyan-600'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon 
                        size={18} 
                        className={`flex-shrink-0 ${
                          isActive ? 'text-cyan-600' : 'text-gray-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer Section */}
          <div className="border-t border-gray-200 p-4 space-y-3">
            {/* System Status */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-emerald-700">System Online</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-mono">v2.4.1</span>
            </div>

            {/* User Card */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center shadow-sm border border-cyan-200 flex-shrink-0">
                  <FiUser className="text-white" size={16} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || 'admin@example.com'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-100 border border-cyan-200 rounded-full text-xs font-semibold text-cyan-700">
                  <FiShield size={12} aria-hidden="true" />
                  Admin
                </span>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg transition-all duration-200 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Logout"
              >
                <FiLogOut size={15} aria-hidden="true" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div 
        ref={mainContentRef}
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? `lg:ml-[${SIDEBAR_WIDTH}px]` : ''
        }`}
        style={{ marginLeft: sidebarOpen ? SIDEBAR_WIDTH : 0 }}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="sidebar-toggle text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-all lg:hidden"
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                aria-expanded={sidebarOpen}
              >
                <FiMenu size={22} />
              </button>
              <div className="hidden sm:block">
                <h3 className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Help */}
              <button
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
                aria-label="Help"
                onClick={() => toast.info('Need help? Check the documentation.')}
              >
                <FiHelpCircle size={20} />
              </button>

              {/* User Menu */}
              <UserMenu user={user} onLogout={handleLogout} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
          role="presentation"
          aria-hidden="true"
        />
      )}
    </div>
  );
}