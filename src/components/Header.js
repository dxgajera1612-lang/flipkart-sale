// components/Header.js
import Link from 'next/link';
import { useState } from 'react';
import { FiMenu, FiX, FiSearch, FiShoppingCart, FiUser } from 'react-icons/fi';

export default function Header({ cartCount = 0, onCartClick, onMenuClick }) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      {/* Top Navigation */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 gap-3 md:gap-4">
        
        {/* Left Section: Menu + Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button 
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <FiMenu size={24} className="text-gray-700" />
          </button>
          
          <Link href="/" className="flex items-center gap-1 flex-shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md flex items-center justify-center flex-shrink-0">
              <svg 
                viewBox="0 0 40 40" 
                className="w-6 h-6 md:w-8 md:h-8" 
                fill="none"
              >
                <path 
                  d="M12 10h16v20H12z" 
                  stroke="white" 
                  strokeWidth="2"
                  fill="white"
                />
                <path 
                  d="M16 20l4-4 4 4" 
                  stroke="#0052CC" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm md:text-base font-bold text-blue-600 leading-none">Flipkart</span>
              <span className="text-xs text-gray-500 leading-none">Lite</span>
            </div>
          </Link>
        </div>

        {/* Search Bar - Hidden on mobile, visible on md+ */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className={`
            w-full flex items-center bg-white border rounded-lg transition-all
            ${isSearchFocused ? 'border-blue-500 shadow-sm' : 'border-gray-300'}
          `}>
            <FiSearch className="ml-3 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Search for products, brands and more"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-gray-700"
            />
          </div>
        </div>

        {/* Right Section: User + Cart */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          
          {/* User Account Button */}
          <button className="hidden md:flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors group">
            <FiUser size={20} className="text-gray-700" />
            <span className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-gray-900">Account</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={onCartClick}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            aria-label={`Shopping cart with ${cartCount} items`}
          >
            <FiShoppingCart size={24} className="text-gray-700 group-hover:text-gray-900" />
            {cartCount > 0 && (
              <span className="
                absolute -top-1 -right-1 
                bg-red-500 text-white 
                text-xs font-bold 
                w-5 h-5 
                rounded-full 
                flex items-center justify-center
                animate-pulse
              ">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="flex items-center bg-gray-100 border border-gray-200 rounded-lg">
          <FiSearch className="ml-3 text-gray-400" size={16} />
          <input
            type="search"
            placeholder="Search products"
            className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-gray-700"
          />
        </div>
      </div>

      {/* Category Bar - Optional (can be toggled) */}
      <div className="hidden lg:block border-t border-gray-100 bg-gray-50">
        <div className="px-6 py-2 flex items-center gap-6 overflow-x-auto">
          <CategoryLink icon="🏠" label="Electronics" />
          <CategoryLink icon="👕" label="Fashion" />
          <CategoryLink icon="🛋️" label="Home" />
          <CategoryLink icon="📱" label="Mobiles" />
          <CategoryLink icon="🎮" label="Gaming" />
          <CategoryLink icon="💄" label="Beauty" />
        </div>
      </div>

      <style jsx>{`
        /* Scrollbar styling for category bar */
        ::-webkit-scrollbar {
          height: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </header>
  );
}

function CategoryLink({ icon, label }) {
  return (
    <a href="#" className="
      flex flex-col items-center gap-1 
      px-3 py-2
      text-xs font-medium text-gray-700
      hover:text-blue-600 transition-colors
      whitespace-nowrap flex-shrink-0
    ">
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </a>
  );
}
