'use client'

import { useState, useEffect } from 'react'

interface DataPoint {
  time: string
  value: number
}

interface RealTimeChartProps {
  title: string
  data: DataPoint[]
  color?: string
  height?: number
}

export default function RealTimeChart({ 
  title, 
  data, 
  color = 'blue', 
  height = 200 
}: RealTimeChartProps) {
  const [animatedData, setAnimatedData] = useState<DataPoint[]>([])

  useEffect(() => {
    setAnimatedData(data)
  }, [data])

  const maxValue = Math.max(...data.map(d => d.value))
  const minValue = Math.min(...data.map(d => d.value))
  const range = maxValue - minValue || 1

  const getPath = () => {
    if (data.length < 2) return ''
    
    const width = 400
    const stepX = width / (data.length - 1)
    
    return data.map((point, index) => {
      const x = index * stepX
      const y = height - ((point.value - minValue) / range) * (height - 40) - 20
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }

  const getGradientId = () => `gradient-${color}-${Math.random().toString(36).substr(2, 9)}`
  const gradientId = getGradientId()

  return (
    <div className="glass rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center space-x-2 text-sm text-blue-300">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>
      
      <div className="relative">
        <svg width="100%" height={height} className="overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={`rgb(59 130 246)`} stopOpacity="0.3" />
              <stop offset="100%" stopColor={`rgb(59 130 246)`} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              y1={20 + ratio * (height - 40)}
              x2="100%"
              y2={20 + ratio * (height - 40)}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}
          
          {/* Area under curve */}
          {data.length > 1 && (
            <path
              d={`${getPath()} L 400 ${height - 20} L 0 ${height - 20} Z`}
              fill={`url(#${gradientId})`}
            />
          )}
          
          {/* Main line */}
          {data.length > 1 && (
            <path
              d={getPath()}
              fill="none"
              stroke="rgb(59 130 246)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />
          )}
          
          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * 400
            const y = height - ((point.value - minValue) / range) * (height - 40) - 20
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="rgb(59 130 246)"
                className="animate-pulse"
              />
            )
          })}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-blue-300 -ml-12">
          <span>{maxValue.toFixed(0)}</span>
          <span>{((maxValue + minValue) / 2).toFixed(0)}</span>
          <span>{minValue.toFixed(0)}</span>
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-blue-300 mt-2">
          {data.slice(0, 5).map((point, index) => (
            <span key={index}>{point.time}</span>
          ))}
        </div>
      </div>
      
      {/* Current value display */}
      <div className="mt-4 text-center">
        <div className="text-2xl font-bold text-blue-400">
          {data[data.length - 1]?.value.toFixed(1) || '0'}
        </div>
        <div className="text-sm text-blue-300">Current Value</div>
      </div>
    </div>
  )
}