'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ComplaintPlatform() {
  const [activeTab, setActiveTab] = useState('overview')

  const complaintCategories = [
    { id: 'water', name: 'Water Supply', icon: '💧', count: 0 },
    { id: 'electricity', name: 'Electricity', icon: '⚡', count: 0 },
    { id: 'roads', name: 'Roads & Infrastructure', icon: '🛣️', count: 0 },
    { id: 'waste', name: 'Waste Management', icon: '🗑️', count: 0 },
    { id: 'public', name: 'Public Services', icon: '🏛️', count: 0 },
    { id: 'other', name: 'Other Issues', icon: '📝', count: 0 }
  ]

  const mockStats = {
    totalComplaints: 0,
    resolved: 0,
    pending: 0,
    avgResolutionTime: 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Local Lens
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">📋 Complaint Management</h1>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                Coming Soon
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Platform Under Development
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
              { id: 'categories', name: 'Categories', icon: '📋' },
              { id: 'features', name: 'Features', icon: '⚙️' },
              { id: 'roadmap', name: 'Development Roadmap', icon: '🗺️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600'
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="text-6xl mb-6">📋</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Government Complaint Management System
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                A comprehensive platform for citizens to file complaints, track progress, and ensure 
                accountability across multiple government departments and authorities.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-teal-600">{mockStats.totalComplaints}</div>
                <div className="text-gray-600">Total Complaints</div>
                <div className="text-sm text-gray-500 mt-1">System not active</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{mockStats.resolved}</div>
                <div className="text-gray-600">Resolved</div>
                <div className="text-sm text-gray-500 mt-1">Awaiting launch</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">{mockStats.pending}</div>
                <div className="text-gray-600">Pending</div>
                <div className="text-sm text-gray-500 mt-1">In development</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{mockStats.avgResolutionTime}d</div>
                <div className="text-gray-600">Avg Resolution</div>
                <div className="text-sm text-gray-500 mt-1">Target: 7 days</div>
              </div>
            </div>

            {/* Development Status */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center">
                🚧 Platform Under Development
              </h2>
              <p className="text-yellow-700 mb-4">
                This comprehensive complaint management system is currently being developed to serve citizens 
                and government authorities across Dehradun and surrounding areas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">Planned Features:</h3>
                  <ul className="text-yellow-700 space-y-1 text-sm">
                    <li>• Multi-category complaint filing</li>
                    <li>• Real-time status tracking</li>
                    <li>• Geolocation-based mapping</li>
                    <li>• Multi-department routing</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">Integration Points:</h3>
                  <ul className="text-yellow-700 space-y-1 text-sm">
                    <li>• Municipal Corporation systems</li>
                    <li>• Utility service providers</li>
                    <li>• Emergency services coordination</li>
                    <li>• Traffic management integration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Complaint Categories</h2>
              <p className="text-gray-600">Organized complaint handling across multiple government departments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {complaintCategories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">{category.icon}</div>
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                      {category.count} complaints
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Dedicated handling for {category.name.toLowerCase()} related issues and concerns.
                  </p>
                  <button 
                    className="w-full bg-gray-200 text-gray-600 py-2 px-4 rounded-lg cursor-not-allowed"
                    disabled
                  >
                    Coming Soon
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Features</h2>
              <p className="text-gray-600">Comprehensive tools for efficient complaint management</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Citizen Features */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  👥 For Citizens
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Easy Complaint Filing</div>
                      <div className="text-sm text-gray-600">Simple form-based complaint submission with photo/video upload</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Real-time Tracking</div>
                      <div className="text-sm text-gray-600">Live status updates and progress notifications</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Location Integration</div>
                      <div className="text-sm text-gray-600">GPS-based complaint mapping and nearby issue discovery</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Mobile App</div>
                      <div className="text-sm text-gray-600">Dedicated mobile application for on-the-go reporting</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Authority Features */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  🏛️ For Authorities
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Dashboard Management</div>
                      <div className="text-sm text-gray-600">Centralized complaint management and assignment system</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Automated Routing</div>
                      <div className="text-sm text-gray-600">Smart complaint assignment based on category and location</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Performance Analytics</div>
                      <div className="text-sm text-gray-600">Detailed reports and performance metrics</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Escalation System</div>
                      <div className="text-sm text-gray-600">Automated escalation for overdue complaints</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Development Roadmap</h2>
              <p className="text-gray-600">Planned development phases for the complaint management system</p>
            </div>

            <div className="space-y-6">
              {[
                {
                  phase: 'Phase 1',
                  title: 'Core Platform Development',
                  status: 'In Progress',
                  items: ['Basic complaint filing system', 'User authentication', 'Category management', 'Admin dashboard'],
                  color: 'yellow'
                },
                {
                  phase: 'Phase 2',
                  title: 'Advanced Features',
                  status: 'Planned',
                  items: ['Real-time notifications', 'Mobile app development', 'Geolocation integration', 'File upload system'],
                  color: 'blue'
                },
                {
                  phase: 'Phase 3',
                  title: 'Integration & Analytics',
                  status: 'Future',
                  items: ['Government system integration', 'Advanced analytics', 'Automated routing', 'Performance metrics'],
                  color: 'purple'
                },
                {
                  phase: 'Phase 4',
                  title: 'AI & Automation',
                  status: 'Future',
                  items: ['AI-powered categorization', 'Predictive analytics', 'Chatbot support', 'Smart escalation'],
                  color: 'green'
                }
              ].map((phase, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        phase.color === 'yellow' ? 'bg-yellow-500' :
                        phase.color === 'blue' ? 'bg-blue-500' :
                        phase.color === 'purple' ? 'bg-purple-500' :
                        'bg-green-500'
                      }`}></div>
                      <h3 className="text-lg font-semibold text-gray-900">{phase.phase}: {phase.title}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      phase.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                      phase.status === 'Planned' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {phase.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {phase.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/"
              className="bg-teal-600 text-white px-8 py-4 rounded-lg hover:bg-teal-700 transition duration-200 font-medium"
            >
              🏠 Return to Main Dashboard
            </Link>
            <Link 
              href="/traffic"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
            >
              🚦 View Traffic System (Live)
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}