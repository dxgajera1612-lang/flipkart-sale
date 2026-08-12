// components/admin/UserMenu.js
import { useState, useRef, useEffect } from 'react';
import { FiUser, FiLogOut, FiSettings, FiHelpCircle, FiChevronDown } from 'react-icons/fi';

export default function UserMenu({ user, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center">
          <FiUser className="text-white" size={16} />
        </div>
        <span className="hidden md:inline text-sm font-medium text-gray-700">
          {user?.name?.split(' ')[0] || 'Admin'}
        </span>
        <FiChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-500">{user?.email || 'admin@example.com'}</p>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
              // Navigate to profile
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FiSettings size={16} />
            Settings
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              // Show help
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <FiHelpCircle size={16} />
            Help
          </button>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}