'use client'

import Link from 'next/link'

export default function BloodPlatform() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600">
                Local Lens
              </Link>
              <span className="ml-3 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                Blood Donation Platform
              </span>
            </div>
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="text-6xl mb-6">🩸</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Blood Donation Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real-time blood donor-recipient matching with emergency response capabilities
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              🚧 Platform Under Development
            </h2>
            <p className="text-yellow-700">
              This platform is currently being developed. It will feature:
            </p>
            <ul className="mt-4 text-left text-yellow-700 space-y-2">
              <li>• Real-time donor-recipient matching</li>
              <li>• Emergency blood request system</li>
              <li>• Blood bank inventory management</li>
              <li>• Location-based search and routing</li>
              <li>• Mobile app for donors and recipients</li>
              <li>• Hospital integration and verification</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">For Donors</h3>
              <p className="text-gray-600 text-sm">
                Register as a donor, manage availability, and receive emergency requests
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">For Recipients</h3>
              <p className="text-gray-600 text-sm">
                Submit blood requests, track status, and find nearby donors
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">For Hospitals</h3>
              <p className="text-gray-600 text-sm">
                Manage blood inventory, coordinate with blood banks, and handle emergencies
              </p>
            </div>
          </div>

          <Link 
            href="/"
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition duration-200 font-medium"
          >
            Return to Main Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}