'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function AboutPage() {
  const features = [
    {
      title: 'Real-Time Conflict Detection',
      description: 'Advanced algorithms analyze flight trajectories in real-time to identify potential conflicts before they occur.',
    },
    {
      title: '3D Globe Visualization',
      description: 'Interactive 3D globe displays flight paths, airports, and conflict zones with intuitive controls.',
    },
    {
      title: 'AI-Powered Solutions',
      description: 'Machine learning algorithms provide intelligent recommendations for conflict resolution.',
    },
    {
      title: 'Cost Optimization',
      description: 'Analyze and optimize flight routes to minimize fuel consumption and operational costs.',
    },
    {
      title: 'Efficiency Analysis',
      description: 'Evaluate airspace utilization and suggest improvements for better traffic flow.',
    },
    {
      title: 'Safety First',
      description: 'Prioritize passenger and aircraft safety with comprehensive risk assessment.',
    },
  ]

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 pt-6">
        <div className="flex items-center justify-center space-x-8">
          <Link href="/" className="text-white text-sm">
            Home
          </Link>
          <Link href="/globe" className="text-white text-sm">
            Visualization
          </Link>
          <Link href="/about" className="text-white text-sm">
            About
          </Link>
          <Link href="/team" className="text-white text-sm">
            Team
          </Link>
          <Link href="/contact" className="text-white text-sm">
            Contact
          </Link>
        </div>
      </nav>

      {/* Content */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">About ConflictZero</h1>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              ConflictZero is an advanced flight trajectory analysis platform designed to revolutionize 
              air traffic management through intelligent conflict detection and resolution.
            </p>
          </motion.div>

          <motion.div
            className="mb-16 p-8 bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-700/30"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-3xl font-semibold text-white mb-6">What We Do</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-4">
              ConflictZero provides air traffic planners with real-time insights into flight trajectories, 
              enabling proactive conflict detection and resolution. Our platform analyzes thousands of flights 
              simultaneously, identifying potential conflicts based on horizontal and vertical separation requirements.
            </p>
            <p className="text-gray-300 text-lg leading-relaxed">
              By leveraging advanced algorithms and AI-powered analysis, we help optimize airspace utilization, 
              reduce delays, minimize costs, and most importantly, ensure the safety of all aircraft in Canadian airspace.
            </p>
          </motion.div>

          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-3xl font-semibold text-white mb-8 text-center">Key Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  className="p-6 bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-700/30"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
                  whileHover={{ borderColor: 'rgba(255, 255, 255, 0.5)', scale: 1.02 }}
                >
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
