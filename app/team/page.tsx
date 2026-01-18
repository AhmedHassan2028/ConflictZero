'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function TeamPage() {
  const teamMembers = [
    {
      name: 'Roheen Ghafuri',
      role: 'Frontend Developer',
      description: 'Designed and developed the entire frontend interface, creating beautiful visualizations and user experiences for ConflictZero.',
    },
    {
      name: 'Murtaza Rhythm',
      role: 'Backend Developer',
      description: 'Built the robust backend infrastructure, implementing flight trajectory analysis and conflict detection algorithms.',
    },
    {
      name: 'Younis Chaounib',
      role: 'Marketing & Strategy',
      description: 'Led marketing efforts and strategic planning, ensuring ConflictZero reaches its target audience effectively.',
    },
    {
      name: 'Ahmed Hassan',
      role: 'Support & Development',
      description: 'Provided essential support across all aspects of the project, contributing wherever needed to ensure success.',
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
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Our Team</h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Meet the talented individuals behind ConflictZero, dedicated to revolutionizing air traffic management.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                className="p-8 bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-700/30"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ borderColor: 'rgba(255, 255, 255, 0.5)', scale: 1.02 }}
              >
                <h3 className="text-2xl font-semibold text-white mb-2">{member.name}</h3>
                <p className="text-gray-400 mb-4">{member.role}</p>
                <p className="text-gray-300">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
