'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Signal {
  id: string
  name: string
  latitude: number
  longitude: number
  status: string
  current_state: string
  last_updated: string
}

interface EmergencyDetection {
  id: number
  timestamp: string
  signal_id: string
  signal_name: string
  vehicle_type: string
  confidence: number
  action_taken: string
  response_time_ms: number
}

interface DashboardMetrics {
  active_signals: number
  emergency_overrides: number
  detections_today: number
  avg_response_time: number
}

export default function TrafficDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [signals, setSignals] = useState<Signal[]>([])
  const [emergencyLog, setEmergencyLog] = useState<EmergencyDetection[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    active_signals: 0,
    emergency_overrides: 0,
    detections_today: 0,
    avg_response_time: 0
  })
  const [selectedSignal, setSelectedSignal] = useState('')
  const [overrideDuration, setOverrideDuration] = useState(60)
  const [overrideReason, setOverrideReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Simulated data - in production this would come from the Flask API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API calls
        const mockSignals: Signal[] = [
          { id: 'clock_tower', name: 'Clock Tower', latitude: 30.3165, longitude: 78.0322, status: 'active', current_state: 'green', last_updated: new Date().toISOString() },
          { id: 'paltan_bazaar', name: 'Paltan Bazaar', latitude: 30.3203, longitude: 78.0389, status: 'active', current_state: 'red', last_updated: new Date().toISOString() },
          { id: 'rispana_bridge', name: 'Rispana Bridge', latitude: 30.3456, longitude: 78.0512, status: 'active', current_state: 'yellow', last_updated: new Date().toISOString() },
          { id: 'gandhi_road', name: 'Gandhi Road', latitude: 30.3293, longitude: 78.0428, status: 'active', current_state: 'green', last_updated: new Date().toISOString() },
          { id: 'rajpur_road', name: 'Rajpur Road', latitude: 30.3742, longitude: 78.0664, status: 'active', current_state: 'red', last_updated: new Date().toISOString() },
          { id: 'saharanpur_road', name: 'Saharanpur Road', latitude: 30.3678, longitude: 78.0598, status: 'emergency', current_state: 'green', last_updated: new Date().toISOString() },
          { id: 'haridwar_road', name: 'Haridwar Road', latitude: 30.2987, longitude: 78.0234, status: 'active', current_state: 'green', last_updated: new Date().toISOString() },
          { id: 'mussoorie_road', name: 'Mussoorie Road', latitude: 30.3567, longitude: 78.0789, status: 'active', current_state: 'red', last_updated: new Date().toISOString() },
          { id: 'chakrata_road', name: 'Chakrata Road', latitude: 30.3234, longitude: 78.0456, status: 'active', current_state: 'yellow', last_updated: new Date().toISOString() },
          { id: 'ballupur', name: 'Ballupur Chowk', latitude: 30.3445, longitude: 78.0623, status: 'active', current_state: 'green', last_updated: new Date().toISOString() }
        ]

        const mockEmergencyLog: EmergencyDetection[] = [
          {
            id: 1,
            timestamp: '2024-12-31T14:32:15Z',
            signal_id: 'saharanpur_road',
            signal_name: 'Saharanpur Road',
            vehicle_type: 'ambulance',
            confidence: 0.94,
            action_taken: 'signal_override',
            response_time_ms: 750
          },
          {
            id: 2,
            timestamp: '2024-12-31T13:45:22Z',
            signal_id: 'clock_tower',
            signal_name: 'Clock Tower',
            vehicle_type: 'police',
            confidence: 0.87,
            action_taken: 'route_calculated',
            response_time_ms: 920
          },
          {
            id: 3,
            timestamp: '2024-12-31T12:18:45Z',
            signal_id: 'paltan_bazaar',
            signal_name: 'Paltan Bazaar',
            vehicle_type: 'fire_truck',
            confidence: 0.91,
            action_taken: 'corridor_created',
            response_time_ms: 680
          }
        ]

        const mockMetrics: DashboardMetrics = {
          active_signals: 10,
          emergency_overrides: 1,
          detections_today: 3,
          avg_response_time: 783
        }

        setSignals(mockSignals)
        setEmergencyLog(mockEmergencyLog)
        setMetrics(mockMetrics)
        setLoading(false)
      } catch (err) {
        setError('Failed to load dashboard data')
        setLoading(false)
      }
    }

    loadData()
    
    // Set up real-time updates
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSignalOverride = async () => {
    if (!selectedSignal) {
      alert('Please select a signal')
      return
    }

    try {
      // In production, this would call the Flask API
      // const response = await fetch(`http://localhost:5000/api/signals/${selectedSignal}/override`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ duration: overrideDuration, reason: overrideReason })
      // })

      // Simulate success
      alert(`Signal ${selectedSignal} overridden for ${overrideDuration} seconds`)
      setSelectedSignal('')
      setOverrideReason('')
    } catch (err) {
      alert('Failed to override signal')
    }
  }

  const getSignalStatusColor = (state: string, status: string) => {
    if (status === 'emergency') return 'bg-orange-500 animate-pulse'
    switch (state) {
      case 'green': return 'bg-green-500'
      case 'yellow': return 'bg-yellow-500'
      case 'red': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'ambulance': return '🚑'
      case 'police': return '🚓'
      case 'fire_truck': return '🚒'
      default: return '🚨'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Traffic Management Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Local Lens
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">🚦 Traffic Management</h1>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                Live System
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Last Updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'signals', name: 'Signal Control', icon: '🚦' },
              { id: 'emergency', name: 'Emergency Log', icon: '🚨' },
              { id: 'analytics', name: 'Analytics', icon: '📈' },
              { id: 'other-platforms', name: 'Other Platforms', icon: '🔗' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{metrics.active_signals}</div>
                <div className="text-gray-600">Active Signals</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">{metrics.emergency_overrides}</div>
                <div className="text-gray-600">Emergency Overrides</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{metrics.detections_today}</div>
                <div className="text-gray-600">Detections Today</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">{metrics.avg_response_time}ms</div>
                <div className="text-gray-600">Avg Response Time</div>
              </div>
            </div>

            {/* Live Map Placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🗺️ Dehradun Traffic Map</h3>
              <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">🗺️</div>
                  <p className="text-gray-600 mb-4">Interactive traffic map with real-time signal status</p>
                  <button 
                    onClick={() => window.open('http://localhost:5000', '_blank')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Open Full Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">🚦 Signal Status</h3>
                <div className="space-y-3">
                  {signals.slice(0, 5).map((signal) => (
                    <div key={signal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{signal.name}</div>
                        <div className="text-sm text-gray-600">{signal.id}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${getSignalStatusColor(signal.current_state, signal.status)}`}></div>
                        <span className="text-sm capitalize">{signal.current_state}</span>
                        {signal.status === 'emergency' && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Emergency</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">🚨 Recent Detections</h3>
                <div className="space-y-3">
                  {emergencyLog.slice(0, 3).map((detection) => (
                    <div key={detection.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getVehicleIcon(detection.vehicle_type)}</span>
                          <span className="font-medium capitalize">{detection.vehicle_type}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(detection.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {detection.signal_name} • Confidence: {(detection.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        ✓ {detection.action_taken.replace('_', ' ')} ({detection.response_time_ms}ms)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signal Control Tab */}
        {activeTab === 'signals' && (
          <div className="space-y-8">
            {/* Manual Override Panel */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🎛️ Manual Signal Override</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Signal</label>
                  <select
                    value={selectedSignal}
                    onChange={(e) => setSelectedSignal(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a signal...</option>
                    {signals.map((signal) => (
                      <option key={signal.id} value={signal.id}>{signal.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
                  <input
                    type="number"
                    value={overrideDuration}
                    onChange={(e) => setOverrideDuration(parseInt(e.target.value))}
                    min="30"
                    max="300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Manual override"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
                  <button
                    onClick={handleSignalOverride}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition duration-200 font-medium"
                  >
                    🚨 Override Signal
                  </button>
                </div>
              </div>
            </div>

            {/* All Signals Grid */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🚦 All Traffic Signals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {signals.map((signal) => (
                  <div key={signal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{signal.name}</h4>
                      <div className={`w-4 h-4 rounded-full ${getSignalStatusColor(signal.current_state, signal.status)}`}></div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>ID: {signal.id}</div>
                      <div>State: <span className="capitalize">{signal.current_state}</span></div>
                      <div>Status: <span className="capitalize">{signal.status}</span></div>
                      <div>Location: {signal.latitude.toFixed(4)}, {signal.longitude.toFixed(4)}</div>
                    </div>
                    {signal.status === 'emergency' && (
                      <div className="mt-3 bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2 rounded text-sm">
                        🚨 Emergency Override Active
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Emergency Log Tab */}
        {activeTab === 'emergency' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">🚨 Emergency Vehicle Detection Log</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emergencyLog.map((detection) => (
                    <tr key={detection.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(detection.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getVehicleIcon(detection.vehicle_type)}</span>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {detection.vehicle_type.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {detection.signal_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          detection.confidence >= 0.9 ? 'bg-green-100 text-green-800' :
                          detection.confidence >= 0.8 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(detection.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {detection.action_taken.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          detection.response_time_ms < 1000 ? 'text-green-600' :
                          detection.response_time_ms < 2000 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {detection.response_time_ms}ms
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Detection Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Ambulance Detections</span>
                    <span className="font-semibold">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Police Vehicle Detections</span>
                    <span className="font-semibold">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fire Truck Detections</span>
                    <span className="font-semibold">1</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Confidence</span>
                    <span className="font-semibold">90.7%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">⚡ Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Fastest Response</span>
                    <span className="font-semibold text-green-600">680ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Slowest Response</span>
                    <span className="font-semibold text-red-600">920ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>System Uptime</span>
                    <span className="font-semibold text-green-600">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Signals Online</span>
                    <span className="font-semibold text-green-600">10/10</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📈 Hourly Activity Chart</h3>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">📈</div>
                  <p className="text-gray-600">Real-time analytics chart would be displayed here</p>
                  <p className="text-sm text-gray-500 mt-2">Showing detection patterns, response times, and system performance</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Platforms Tab */}
        {activeTab === 'other-platforms' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🔗 Other Local Lens Platforms</h2>
              <p className="text-gray-600">Access other specialized systems in the Local Lens ecosystem</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Blood Donation Platform */}
              <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">🩸</div>
                  <span className="bg-red-400 bg-opacity-30 px-3 py-1 rounded-full text-sm">Coming Soon</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Blood Donation Platform</h3>
                <p className="text-red-100 mb-4">
                  Real-time blood donor-recipient matching with emergency response capabilities and inventory management.
                </p>
                <div className="space-y-2 text-sm text-red-100">
                  <div>• Smart donor-recipient matching</div>
                  <div>• Emergency blood request system</div>
                  <div>• Inventory tracking & alerts</div>
                  <div>• Mobile notifications</div>
                </div>
                <button 
                  className="mt-4 w-full bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg cursor-not-allowed"
                  disabled
                >
                  Platform Under Development
                </button>
              </div>

              {/* Complaint Management Platform */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">📋</div>
                  <span className="bg-blue-400 bg-opacity-30 px-3 py-1 rounded-full text-sm">Coming Soon</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Government Complaint Management</h3>
                <p className="text-blue-100 mb-4">
                  Citizen complaint filing, tracking, and resolution with multi-authority coordination and analytics.
                </p>
                <div className="space-y-2 text-sm text-blue-100">
                  <div>• Multi-category complaint filing</div>
                  <div>• Real-time status tracking</div>
                  <div>• Authority assignment system</div>
                  <div>• Performance analytics</div>
                </div>
                <button 
                  className="mt-4 w-full bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg cursor-not-allowed"
                  disabled
                >
                  Platform Under Development
                </button>
              </div>

              {/* Architecture Platform */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">🏗️</div>
                  <span className="bg-purple-400 bg-opacity-30 px-3 py-1 rounded-full text-sm">Coming Soon</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Architecture Platform</h3>
                <p className="text-purple-100 mb-4">
                  Scalable application framework with DevOps integration and production-ready templates.
                </p>
                <div className="space-y-2 text-sm text-purple-100">
                  <div>• Project template generator</div>
                  <div>• DevOps pipeline automation</div>
                  <div>• Cloud deployment tools</div>
                  <div>• Monitoring & analytics</div>
                </div>
                <button 
                  className="mt-4 w-full bg-white bg-opacity-20 text-white py-2 px-4 rounded-lg cursor-not-allowed"
                  disabled
                >
                  Platform Under Development
                </button>
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🔄 Platform Integration Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-medium">Traffic Management System</span>
                  </div>
                  <span className="text-green-600 font-medium">✓ Operational</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Blood Donation Platform</span>
                  </div>
                  <span className="text-yellow-600 font-medium">⏳ In Development</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Complaint Management</span>
                  </div>
                  <span className="text-yellow-600 font-medium">⏳ In Development</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="font-medium">Architecture Platform</span>
                  </div>
                  <span className="text-yellow-600 font-medium">⏳ In Development</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/"
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition duration-200"
                >
                  🏠 Return to Main Dashboard
                </Link>
                <button 
                  onClick={() => window.open('http://localhost:5000', '_blank')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  🚦 Open Full Traffic Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}