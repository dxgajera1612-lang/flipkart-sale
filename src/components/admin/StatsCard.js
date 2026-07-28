// components/admin/StatsCard.js
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

/**
 * Enhanced Stats Card Component with gradient backgrounds and animations
 */
export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  trend = null,
  trendValue = null,
  loading = false,
  onClick = null,
}) {
  const colorGradients = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    cyan: 'from-cyan-500 to-cyan-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  const bgLight = {
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
    green: 'bg-green-50',
    orange: 'bg-orange-50',
    pink: 'bg-pink-50',
    cyan: 'bg-cyan-50',
    red: 'bg-red-50',
    yellow: 'bg-yellow-50',
  };

  const textColor = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    pink: 'text-pink-600',
    cyan: 'text-cyan-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
  };

  return (
    <div
      onClick={onClick}
      className={`group card bg-white border border-slate-200/50 hover:border-slate-300 transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-xl hover:scale-102' : 'hover:shadow-lg'
      } overflow-hidden relative`}
    >
      {/* Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorGradients[color]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {title}
            </p>
          </div>

          {/* Icon Container */}
          <div className={`${bgLight[color]} p-3 rounded-lg group-hover:shadow-md transition-all transform group-hover:scale-110`}>
            <Icon className={`${textColor[color]} transition-transform`} size={22} />
          </div>
        </div>

        {/* Value */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {loading ? (
              <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-slate-900 mb-2">{value}</p>
            )}

            {/* Trend */}
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? (
                  <FiTrendingUp size={16} />
                ) : (
                  <FiTrendingDown size={16} />
                )}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Accent */}
        <div className={`h-1 bg-gradient-to-r ${colorGradients[color]} opacity-0 group-hover:opacity-100 transition-all duration-300 -mx-6 -mb-6 mt-2`}></div>
      </div>
    </div>
  );
}
