'use client'

import { useState, useEffect } from 'react'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  duration?: number
}

interface NotificationSystemProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export default function NotificationSystem({ notifications, onRemove }: NotificationSystemProps) {
  useEffect(() => {
    notifications.forEach((notification) => {
      const duration = notification.duration || 5000
      const timer = setTimeout(() => {
        onRemove(notification.id)
      }, duration)

      return () => clearTimeout(timer)
    })
  }, [notifications, onRemove])

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📢'
    }
  }

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/90 border-green-400/50'
      case 'error': return 'bg-red-500/90 border-red-400/50'
      case 'warning': return 'bg-yellow-500/90 border-yellow-400/50'
      case 'info': return 'bg-blue-500/90 border-blue-400/50'
      default: return 'bg-gray-500/90 border-gray-400/50'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getColorClasses(notification.type)} text-white p-4 rounded-xl shadow-2xl backdrop-blur-sm border animate-slideInRight`}
        >
          <div className="flex items-start space-x-3">
            <span className="text-xl flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{notification.title}</div>
              <div className="text-sm opacity-90 mt-1">{notification.message}</div>
              <div className="text-xs opacity-70 mt-2">
                {notification.timestamp.toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() => onRemove(notification.id)}
              className="text-white/70 hover:text-white transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}