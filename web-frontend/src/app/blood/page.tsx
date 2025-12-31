'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BloodPlatform() {
  const [activeTab, setActiveTab] = useState('overview')

  const bloodTypes = [
    { type: 'O+', donors: 0, requests: 0, compatibility: 'Universal donor for Rh+' },
    { type: 'O-', donors: 0, requests: 0, compatibility: 'Universal donor' },
    { type: 'A+', donors: 0, requests: 0, compatibility: 'Can donate to A+, AB+' },
    { type: 'A-', donors: 0, requests: 0, compatibility: 'Can donate to A+, A-, AB+, AB-' },
    { type: 'B+', donors: 0, requests: 0, compatibility: 'Can donate to B+, AB+' },
    { type: 'B-', donors: 0, requests: 0, compatibility: 'Can donate to B+, B-, AB+, AB-' },
    { type: 'AB+', donors: 0, requests: 0, compatibility: 'Universal recipient' },
    { type: 'AB-', donors: 0, requests: 0, compatibility: 'Can receive from all Rh-' }
  ]

  const emergencyServices = [
    { name: 'AIIMS Rishikesh', distance: '45 km', bloodBank: true, emergency: true },
    { name: 'Doon Hospital', distance: '8 km', bloodBank: true, emergency: true },
    { name: 'Max Super Speciality', distance: '12 km', bloodBank: false, emergency: true },
    { name: 'Shri Mahant Indiresh Hospital', distance: '15 km', bloodBank: true, emergency: false }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Local Lens
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">🩸 Blood Donation Platform</h1>
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
              { id: 'blood-types', name: 'Blood Types', icon: '🩸' },
              { id: 'emergency', name: 'Emergency Network', icon: '🚨' },
              { id: 'roadmap', name: 'Development Roadmap', icon: '🗺️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
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
              <div className="text-6xl mb-6">🩸</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Blood Donation Platform
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                A life-saving platform connecting blood donors with recipients through real-time matching, 
                emergency response coordination, and comprehensive blood bank management.
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-red-600">0</div>
                <div className="text-gray-600">Registered Donors</div>
                <div className="text-sm text-gray-500 mt-1">System not active</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">0</div>
                <div className="text-gray-600">Active Requests</div>
                <div className="text-sm text-gray-500 mt-1">Awaiting launch</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-green-600">0</div>
                <div className="text-gray-600">Successful Matches</div>
                <div className="text-sm text-gray-500 mt-1">In development</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">4</div>
                <div className="text-gray-600">Partner Hospitals</div>
                <div className="text-sm text-gray-500 mt-1">Planned partnerships</div>
              </div>
            </div>

            {/* Development Status */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center">
                🚧 Platform Under Development
              </h2>
              <p className="text-yellow-700 mb-4">
                The Blood Donation Platform is being designed to save lives through efficient donor-recipient 
                matching and emergency response coordination across Dehradun and surrounding regions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">Core Features:</h3>
                  <ul className="text-yellow-700 space-y-1 text-sm">
                    <li>• Real-time donor-recipient matching</li>
                    <li>• Emergency blood request system</li>
                    <li>• Blood bank inventory management</li>
                    <li>• Location-based donor search</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">Advanced Capabilities:</h3>
                  <ul className="text-yellow-700 space-y-1 text-sm">
                    <li>• Mobile app for instant notifications</li>
                    <li>• Hospital integration and verification</li>
                    <li>• Donation history and health tracking</li>
                    <li>• Emergency services coordination</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Target Users */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🤝 For Donors
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Register as a donor, manage availability, and receive emergency requests in your area
                </p>
                <ul className="text-gray-600 text-xs space-y-1">
                  <li>• Profile and health history management</li>
                  <li>• Donation scheduling and reminders</li>
                  <li>• Emergency notification system</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🏥 For Recipients
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Submit blood requests, track status, and find nearby compatible donors quickly
                </p>
                <ul className="text-gray-600 text-xs space-y-1">
                  <li>• Urgent blood request submission</li>
                  <li>• Real-time matching and notifications</li>
                  <li>• Hospital coordination and verification</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🏥 For Hospitals
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Manage blood inventory, coordinate with blood banks, and handle emergency situations
                </p>
                <ul className="text-gray-600 text-xs space-y-1">
                  <li>• Blood bank inventory management</li>
                  <li>• Emergency request coordination</li>
                  <li>• Donor verification and screening</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Blood Types Tab */}
        {activeTab === 'blood-types' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Blood Type Management</h2>
              <p className="text-gray-600">Comprehensive tracking and matching for all blood types</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {bloodTypes.map((blood) => (
                <div key={blood.type} className="bg-white rounded-lg shadow p-6 text-center">
                  <div className="text-2xl font-bold text-red-600 mb-2">{blood.type}</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Donors:</span>
                      <span className="font-medium">{blood.donors}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requests:</span>
                      <span className="font-medium">{blood.requests}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">{blood.compatibility}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Blood Compatibility Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Blood Compatibility Matrix</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center text-gray-600 mb-4">
                  <div className="text-4xl mb-2">🩸</div>
                  <p>Interactive blood compatibility chart will be displayed here</p>
                  <p className="text-sm mt-2">Showing donor-recipient compatibility for all blood types</p>
                </div>
              </div>
            </div>

            {/* Emergency Blood Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">🚨 Critical Need</h3>
                <p className="text-red-700 text-sm mb-4">
                  Blood types with highest demand and lowest availability
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">O- (Universal Donor)</span>
                    <span className="text-red-600">High Priority</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">AB- (Rare Type)</span>
                    <span className="text-red-600">High Priority</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Well Stocked</h3>
                <p className="text-green-700 text-sm mb-4">
                  Blood types with adequate supply levels
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">O+ (Common Type)</span>
                    <span className="text-green-600">Good Supply</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">A+ (Common Type)</span>
                    <span className="text-green-600">Good Supply</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Network Tab */}
        {activeTab === 'emergency' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Emergency Response Network</h2>
              <p className="text-gray-600">Connected hospitals and blood banks for rapid emergency response</p>
            </div>

            {/* Partner Hospitals */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Partner Hospitals & Blood Banks</h3>
              <div className="space-y-4">
                {emergencyServices.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">🏥</div>
                      <div>
                        <div className="font-medium text-gray-900">{service.name}</div>
                        <div className="text-sm text-gray-600">Distance: {service.distance}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {service.bloodBank && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Blood Bank</span>
                      )}
                      {service.emergency && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Emergency</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Response Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Emergency Features</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Instant Alert System</div>
                      <div className="text-sm text-gray-600">Push notifications to nearby compatible donors</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">GPS-Based Matching</div>
                      <div className="text-sm text-gray-600">Find closest available donors in real-time</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Hospital Coordination</div>
                      <div className="text-sm text-gray-600">Direct integration with hospital systems</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Mobile Integration</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Mobile App Notifications</div>
                      <div className="text-sm text-gray-600">Instant alerts for emergency requests</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">One-Touch Response</div>
                      <div className="text-sm text-gray-600">Quick acceptance and location sharing</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Route Optimization</div>
                      <div className="text-sm text-gray-600">Fastest route to donation center</div>
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
              <p className="text-gray-600">Planned development phases for the blood donation platform</p>
            </div>

            <div className="space-y-6">
              {[
                {
                  phase: 'Phase 1',
                  title: 'Core Platform & Matching System',
                  status: 'In Progress',
                  items: ['User registration and profiles', 'Basic donor-recipient matching', 'Blood type compatibility system', 'Admin dashboard development'],
                  color: 'yellow'
                },
                {
                  phase: 'Phase 2',
                  title: 'Mobile App & Real-time Features',
                  status: 'Planned',
                  items: ['Mobile application development', 'Push notification system', 'Real-time location tracking', 'Emergency alert system'],
                  color: 'blue'
                },
                {
                  phase: 'Phase 3',
                  title: 'Hospital Integration & Advanced Features',
                  status: 'Future',
                  items: ['Hospital system integration', 'Blood bank inventory management', 'Advanced matching algorithms', 'Health screening integration'],
                  color: 'purple'
                },
                {
                  phase: 'Phase 4',
                  title: 'AI & Analytics',
                  status: 'Future',
                  items: ['Predictive demand analytics', 'AI-powered donor recommendations', 'Health trend analysis', 'Automated campaign management'],
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
              className="bg-red-600 text-white px-8 py-4 rounded-lg hover:bg-red-700 transition duration-200 font-medium"
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