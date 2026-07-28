// components/PaymentMethods.js
import Image from 'next/image';
import { useState } from 'react';
import { FiInfo } from 'react-icons/fi';

/**
 * Payment Methods Component with 5 payment icons
 * - Google Pay
 * - PhonePe
 * - PayTM
 * - UPI
 * - Credit/Debit Card (SecurePay)
 */
export default function PaymentMethods({ onSelect, selectedMethod = null }) {
  const [hoveredMethod, setHoveredMethod] = useState(null);

  const paymentMethods = [
    {
      id: 'gpay',
      name: 'Google Pay',
      icon: '/assets/images/gpay_icon.svg',
      description: 'Fast & Secure',
      color: 'from-blue-400 to-blue-600',
      textColor: 'text-blue-600',
    },
    {
      id: 'phonepe',
      name: 'PhonePe',
      icon: '/assets/images/phonepe.svg',
      description: 'Instant Money Transfer',
      color: 'from-purple-400 to-purple-600',
      textColor: 'text-purple-600',
    },
    {
      id: 'paytm',
      name: 'PayTM',
      icon: '/assets/images/paytm_icon.svg',
      description: 'Digital Wallet',
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-600',
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: '/assets/images/upi.svg',
      description: 'Direct Bank Transfer',
      color: 'from-indigo-400 to-indigo-600',
      textColor: 'text-indigo-600',
    },
    {
      id: 'card',
      name: 'Card/NetBanking',
      icon: '/assets/images/SecurePay.svg',
      description: 'Secure Payment',
      color: 'from-green-400 to-green-600',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Payment Method</h2>
        <p className="text-gray-600 flex items-center gap-2">
          <FiInfo size={18} />
          Choose your preferred payment method to proceed
        </p>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isHovered = hoveredMethod === method.id;

          return (
            <button
              key={method.id}
              onClick={() => onSelect?.(method.id)}
              onMouseEnter={() => setHoveredMethod(method.id)}
              onMouseLeave={() => setHoveredMethod(null)}
              className={`relative p-4 rounded-xl transition-all duration-300 transform ${
                isSelected
                  ? `ring-2 ring-offset-2 ring-primary-500 shadow-lg scale-105 bg-gradient-to-br ${method.color}`
                  : `bg-white border-2 border-gray-200 hover:border-gray-300 ${
                      isHovered ? 'shadow-md scale-102' : 'shadow-sm'
                    }`
              }`}
            >
              {/* Icon Container */}
              <div className="flex flex-col items-center justify-center h-full">
                <div
                  className={`relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-2 transition-all ${
                    isSelected ? 'bg-white/90 rounded-full p-2' : ''
                  }`}
                >
                  <Image
                    src={method.icon}
                    alt={method.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>

                {/* Text */}
                <p
                  className={`text-xs md:text-sm font-bold text-center transition-all ${
                    isSelected ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {method.name}
                </p>

                {/* Description - Show on hover or selection */}
                {(isHovered || isSelected) && (
                  <p
                    className={`text-xs text-center mt-1 transition-all ${
                      isSelected ? 'text-white/90' : `${method.textColor}`
                    }`}
                  >
                    {method.description}
                  </p>
                )}

                {/* Checkmark for selected */}
                {isSelected && (
                  <div className="absolute top-1 right-1 md:top-2 md:right-2 w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 md:w-4 md:h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Box */}
      {selectedMethod && (
        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg animate-fade-in">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Your payment information is encrypted and secured. We support all major payment methods with instant confirmation.
          </p>
        </div>
      )}
    </div>
  );
}
