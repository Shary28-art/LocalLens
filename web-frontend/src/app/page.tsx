'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple authentication (in production, this would be proper authentication)
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Invalid credentials. Use admin/admin for demo.')
    }
  }

  const platforms = [
    {
      id: 'blood',
      name: 'Blood Donation Platform',
      description: 'Real-time blood donor-recipient matching with emergency response capabilities',
      icon: '🩸',
      status: 'Coming Soon',
      enabled: false,
      route: '/blood'
    },
    {
      id: 'complaint',
      name: 'Government Complaint Management',
      description: 'Citizen complaint filing, tracking, and resolution with multi-authority coordination',
      icon: '📋',
      status: 'Coming Soon',
      enabled: false,
      route: '/complaint'
    },
    {
      id: 'architecture',
      name: 'Architecture Platform',
      description: 'Scalable application framework with DevOps integration and production-ready templates',
      icon: '🏗️',
      status: 'Coming Soon',
      enabled: false,
      route: '/architecture'
    },
    {
      id: 'traffic',
      name: 'Traffic Management System',
      description: 'AI-powered traffic control with emergency vehicle detection and smart routing',
      icon: '🚦',
      status: 'Active',
      enabled: true,
      route: '/traffic'
    }
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Local Lens</h1>
              <p className="text-gray-600">Multi-Platform System</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter username"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                  required
                />
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Sign In
              </button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              Demo credentials: admin / admin
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Local Lens</h1>
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Multi-Platform System
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, Admin</span>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-gray-500 hover:text-gray-700 transition duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access specialized systems for blood donation management, government complaint handling, 
            architecture services, and intelligent traffic control.
          </p>
        </div>

        {/* Featured Platform - Traffic Management */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="text-5xl">🚦</div>
                  <div>
                    <h3 className="text-3xl font-bold">Traffic Management System</h3>
                    <p className="text-blue-100 text-lg">AI-Powered Smart Traffic Control for Dehradun</p>
                  </div>
                </div>
                <div className="bg-green-500 bg-opacity-20 px-4 py-2 rounded-full">
                  <span className="text-green-100 font-medium">🟢 Live & Operational</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="text-2xl font-bold">10</div>
                  <div className="text-blue-100">Active Signals</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="text-2xl font-bold">783ms</div>
                  <div className="text-blue-100">Avg Response</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-4">
                  <div className="text-2xl font-bold">97.5%</div>
                  <div className="text-blue-100">System Uptime</div>
                </div>
              </div>
              
              <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                Real-time emergency vehicle detection with computer vision, intelligent signal coordination, 
                and optimized routing for ambulances, police, and fire trucks across Dehradun's traffic network.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => router.push('/traffic')}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition duration-200 font-medium flex items-center"
                >
                  <span>🎛️ Control Dashboard</span>
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => window.open('http://localhost:5000', '_blank')}
                  className="bg-blue-500 bg-opacity-30 text-white px-6 py-3 rounded-lg hover:bg-opacity-40 transition duration-200 font-medium flex items-center"
                >
                  <span>🗺️ Live Map View</span>
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white bg-opacity-5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white bg-opacity-5 rounded-full -ml-24 -mb-24"></div>
          </div>
        </div>

        {/* Other Platforms Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Other Platforms in Development</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platforms.filter(p => p.id !== 'traffic').map((platform) => (
              <div
                key={platform.id}
                className={`platform-card ${platform.id} ${!platform.enabled ? 'disabled' : ''} 
                           rounded-2xl p-6 text-white cursor-pointer relative overflow-hidden transition-transform hover:scale-105`}
                onClick={() => {
                  if (platform.enabled) {
                    router.push(platform.route)
                  }
                }}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">{platform.icon}</div>
                    <div className="bg-gray-500 bg-opacity-30 px-3 py-1 rounded-full text-sm">
                      Coming Soon
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3">{platform.name}</h3>
                  <p className="text-gray-200 leading-relaxed">
                    {platform.description}
                  </p>
                  
                  <div className="mt-4 text-sm text-gray-300">
                    Platform under development
                  </div>
                </div>
                
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white bg-opacity-10 rounded-full -mr-12 -mt-12"></div>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {platforms.map((platform) => (
              <div key={platform.id} className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${
                  platform.enabled ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <div className="text-sm font-medium text-gray-900">{platform.name}</div>
                <div className={`text-xs ${platform.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {platform.enabled ? 'Operational' : 'In Development'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => router.push('/traffic')}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium flex items-center"
            >
              🎛️ Traffic Control Panel
            </button>
            <button 
              onClick={() => window.open('http://localhost:5000', '_blank')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition duration-200 font-medium flex items-center"
            >
              🗺️ Live Traffic Map
            </button>
            <button 
              className="bg-gray-300 text-gray-600 px-8 py-4 rounded-lg cursor-not-allowed"
              disabled
            >
              🩸 Blood Platform (Coming Soon)
            </button>
            <button 
              className="bg-gray-300 text-gray-600 px-8 py-4 rounded-lg cursor-not-allowed"
              disabled
            >
              📋 Complaint System (Coming Soon)
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Local Lens Multi-Platform System. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Currently featuring: Traffic Management System | Coming Soon: Blood Donation, Complaint Management, Architecture Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}