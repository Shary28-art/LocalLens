'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ArchitecturePlatform() {
  const [activeTab, setActiveTab] = useState('overview')

  const templateCategories = [
    { id: 'web', name: 'Web Applications', icon: '🌐', count: 0, description: 'Full-stack web app templates' },
    { id: 'api', name: 'API Services', icon: '🔌', count: 0, description: 'RESTful and GraphQL APIs' },
    { id: 'mobile', name: 'Mobile Apps', icon: '📱', count: 0, description: 'React Native & Flutter' },
    { id: 'microservices', name: 'Microservices', icon: '🔧', count: 0, description: 'Distributed architectures' },
    { id: 'devops', name: 'DevOps Pipelines', icon: '🚀', count: 0, description: 'CI/CD and deployment' },
    { id: 'monitoring', name: 'Monitoring', icon: '📊', count: 0, description: 'Observability solutions' }
  ]

  const techStack = [
    { category: 'Frontend', technologies: ['React', 'Next.js', 'Vue.js', 'Angular', 'TypeScript'] },
    { category: 'Backend', technologies: ['Node.js', 'Python', 'Java', 'Go', 'C#'] },
    { category: 'Database', technologies: ['PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch'] },
    { category: 'Cloud', technologies: ['AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes'] },
    { category: 'DevOps', technologies: ['GitHub Actions', 'Jenkins', 'Terraform', 'Ansible'] }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Local Lens
              </Link>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">🏗️ Architecture Platform</h1>
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
              { id: 'templates', name: 'Templates', icon: '📋' },
              { id: 'tech-stack', name: 'Tech Stack', icon: '⚙️' },
              { id: 'roadmap', name: 'Development Roadmap', icon: '🗺️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
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
              <div className="text-6xl mb-6">🏗️</div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Architecture Platform
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                A comprehensive development platform providing production-ready templates, 
                automated DevOps pipelines, and scalable architecture patterns for modern applications.
              </p>
            </div>

            {/* Key Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Templates</h3>
                <p className="text-gray-600 text-sm">
                  Production-ready boilerplates for web apps, APIs, and microservices
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-4">🚀</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">DevOps Automation</h3>
                <p className="text-gray-600 text-sm">
                  Automated CI/CD pipelines, infrastructure as code, and deployment tools
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Monitoring & Analytics</h3>
                <p className="text-gray-600 text-sm">
                  Built-in observability, performance monitoring, and business analytics
                </p>
              </div>
            </div>

            {/* Development Status */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center">
                🚧 Platform Under Development
              </h2>
              <p className="text-yellow-700 mb-4">
                The Architecture Platform is being designed to accelerate development workflows 
                and provide enterprise-grade solutions for teams of all sizes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">Core Components:</h3>
                  <ul className="text-yellow-700 space-y-1 text-sm">
                    <li>• Template generator and customizer</li>
                    <li>• Automated project scaffolding</li>
                    <li>• DevOps pipeline configuration</li>
                    <li>• Cloud deployment automation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">Integration Features:</h3>
                  <ul className="text-yellow-700 space-y-1 text-sm">
                    <li>• Multi-cloud deployment support</li>
                    <li>• Third-party service integrations</li>
                    <li>• Monitoring and alerting setup</li>
                    <li>• Security best practices enforcement</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Target Users */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  👨‍💻 For Developers
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Access pre-built templates, boilerplates, and development tools to accelerate project delivery
                </p>
                <ul className="text-gray-600 text-xs space-y-1">
                  <li>• Code generation and scaffolding</li>
                  <li>• Best practice implementations</li>
                  <li>• Testing and quality assurance</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🔧 For DevOps Teams
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Automated CI/CD pipelines, infrastructure as code, and deployment automation tools
                </p>
                <ul className="text-gray-600 text-xs space-y-1">
                  <li>• Pipeline template library</li>
                  <li>• Infrastructure automation</li>
                  <li>• Monitoring and observability</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  🏢 For Organizations
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Enterprise-grade solutions, monitoring dashboards, and scalability planning tools
                </p>
                <ul className="text-gray-600 text-xs space-y-1">
                  <li>• Enterprise architecture patterns</li>
                  <li>• Compliance and security frameworks</li>
                  <li>• Performance optimization</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Templates</h2>
              <p className="text-gray-600">Production-ready templates for rapid application development</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templateCategories.map((template) => (
                <div key={template.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">{template.icon}</div>
                    <div className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-600">
                      {template.count} templates
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                  <button 
                    className="w-full bg-gray-200 text-gray-600 py-2 px-4 rounded-lg cursor-not-allowed"
                    disabled
                  >
                    Coming Soon
                  </button>
                </div>
              ))}
            </div>

            {/* Template Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Included in Every Template:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Authentication & authorization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Database integration & migrations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>API documentation (OpenAPI/Swagger)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Testing framework setup</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">DevOps Integration:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Docker containerization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>CI/CD pipeline configuration</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Environment configuration</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <span>Monitoring and logging</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tech Stack Tab */}
        {activeTab === 'tech-stack' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Supported Technologies</h2>
              <p className="text-gray-600">Modern tech stack with industry-standard tools and frameworks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {techStack.map((stack, index) => (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{stack.category}</h3>
                  <div className="space-y-2">
                    {stack.technologies.map((tech, techIndex) => (
                      <div key={techIndex} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">{tech}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Architecture Patterns */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Architecture Patterns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Application Architectures:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Monolithic applications</li>
                    <li>• Microservices architecture</li>
                    <li>• Serverless functions</li>
                    <li>• Event-driven architecture</li>
                    <li>• API-first design</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Design Patterns:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Clean Architecture</li>
                    <li>• Domain-Driven Design (DDD)</li>
                    <li>• CQRS and Event Sourcing</li>
                    <li>• Repository Pattern</li>
                    <li>• Dependency Injection</li>
                  </ul>
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
              <p className="text-gray-600">Planned development phases for the architecture platform</p>
            </div>

            <div className="space-y-6">
              {[
                {
                  phase: 'Phase 1',
                  title: 'Template Engine & Core Platform',
                  status: 'In Progress',
                  items: ['Template generator system', 'Basic project scaffolding', 'Configuration management', 'User interface development'],
                  color: 'yellow'
                },
                {
                  phase: 'Phase 2',
                  title: 'DevOps Integration',
                  status: 'Planned',
                  items: ['CI/CD pipeline templates', 'Docker containerization', 'Cloud deployment automation', 'Infrastructure as Code'],
                  color: 'blue'
                },
                {
                  phase: 'Phase 3',
                  title: 'Advanced Features',
                  status: 'Future',
                  items: ['Multi-cloud support', 'Advanced monitoring', 'Security scanning', 'Performance optimization'],
                  color: 'purple'
                },
                {
                  phase: 'Phase 4',
                  title: 'Enterprise & AI Features',
                  status: 'Future',
                  items: ['Enterprise integrations', 'AI-powered recommendations', 'Custom template builder', 'Advanced analytics'],
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
              className="bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition duration-200 font-medium"
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