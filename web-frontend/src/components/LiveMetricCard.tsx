'use client'

import { useState, useEffect } from 'react'

interface LiveMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow'
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  isLive?: boolean
}

export default function LiveMetricCard({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  trendValue,
  isLive = false
}: LiveMetricCardProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true)
      setTimeout(() => {
        setDisplayValue(value)
        setIsAnimating(false)
      }, 300)
    }
  }, [value, displayValue])

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'from-blue-500 to-blue-600 shadow-blue-500/30'
      case 'green': return 'from-green-500 to-green-600 shadow-green-500/30'
      case 'orange': return 'from-orange-500 to-orange-600 shadow-orange-500/30'
      case 'purple': return 'from-purple-500 to-purple-600 shadow-purple-500/30'
      case 'red': return 'from-red-500 to-red-600 shadow-red-500/30'
      case 'yellow': return 'from-yellow-500 to-yellow-600 shadow-yellow-500/30'
      default: return 'from-gray-500 to-gray-600 shadow-gray-500/30'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '📈'
      case 'down': return '📉'
      case 'stable': return '➡️'
      default: return ''
    }
  }

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-green-400'
      case 'down': return 'text-red-400'
      case 'stable': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/20 card-hover relative overflow-hidden">
      {isLive && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      )}
      
      <div className={`w-16 h-16 bg-gradient-to-br ${getColorClasses(color)} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
        <span className="text-2xl">{icon}</span>
      </div>
      
      <div className={`text-4xl font-bold text-${color}-400 mb-2 text-center transition-all duration-300 ${
        isAnimating ? 'scale-110 opacity-50' : 'scale-100 opacity-100'
      }`}>
        {displayValue}
      </div>
      
      <div className="text-blue-200 text-sm text-center mb-2">{title}</div>
      
      {subtitle && (
        <div className="text-xs text-blue-300 text-center">{subtitle}</div>
      )}
      
      {trend && trendValue && (
        <div className={`flex items-center justify-center space-x-1 mt-3 text-xs ${getTrendColor(trend)}`}>
          <span>{getTrendIcon(trend)}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  )
}