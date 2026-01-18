'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showNav, setShowNav] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  })
  const { scrollYProgress: imageScrollProgress } = useScroll({
    target: imageRef,
    offset: ['start end', 'end start']
  })
  
  const imageScale = useTransform(imageScrollProgress, [0, 1], [0.5, 1.2])
  const buttonOpacity = useTransform(imageScrollProgress, [0.6, 0.9], [0, 1])


  // Generate star positions once and store them
  const starPositions = useRef(
    Array.from({ length: 80 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
  ).current

  useEffect(() => {
    let rafId: number
    const handleMouseMove = (e: MouseEvent) => {
      // Cancel any pending animation frame
      if (rafId) cancelAnimationFrame(rafId)
      
      // Use requestAnimationFrame to throttle updates
      rafId = requestAnimationFrame(() => {
        // Extremely slow movement - barely perceptible
        setMousePosition({
          x: (e.clientX / window.innerWidth - 0.5) * 1,
          y: (e.clientY / window.innerHeight - 0.5) * 1,
        })
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < 100) {
        // Show nav at the top
        setShowNav(true)
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide nav
        setShowNav(false)
      } else {
        // Scrolling up - show nav
        setShowNav(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <main ref={containerRef} className="relative min-h-screen overflow-hidden bg-black">
      {/* Navigation Bar - Simple white text centered, hides on scroll down */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 pt-6"
        initial={{ opacity: 1, y: 0 }}
        animate={{ 
          opacity: showNav ? 1 : 0,
          y: showNav ? 0 : -50
        }}
        transition={{ duration: 0.3 }}
      >
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
      </motion.nav>

      {/* Animated background gradient - black theme */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      
      {/* Stars with slow automatic drift movement */}
      <div className="fixed inset-0 overflow-hidden">
        {starPositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.3, 1],
              x: [0, (Math.sin(i) * 20), 0],
              y: [0, (Math.cos(i) * 20), 0],
            }}
            transition={{
              opacity: { duration: 8 + (i % 10), repeat: Infinity, delay: (i % 5), ease: 'easeInOut' },
              scale: { duration: 8 + (i % 10), repeat: Infinity, delay: (i % 5), ease: 'easeInOut' },
              x: { duration: 3 + (i % 3), repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 2.5 + (i % 2.5), repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        ))}
      </div>

      {/* Parallax sections */}
      <section className="relative min-h-screen flex items-center justify-center z-10 pt-16">
        <motion.div
          className="text-center px-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-7xl md:text-9xl font-bold mb-6 text-white tracking-tight"
            style={{
              fontFamily: 'var(--font-conflict-zero), system-ui, sans-serif',
              x: mousePosition.x * 0.1,
              y: mousePosition.y * 0.1,
              textShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            ConflictZero
          </motion.h1>
          <motion.p
            className="text-2xl md:text-3xl text-gray-100 mb-8 max-w-3xl mx-auto relative font-normal tracking-wide"
            style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              x: mousePosition.x * 0.08,
              y: mousePosition.y * 0.08,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="text-white">Real-Time</span> Flight Intelligence
            <br />
            <span className="text-gray-300 font-light">Predict • Prevent • Protect</span>
            {/* Subtle decorative dots */}
            <span className="absolute -left-3 top-1/2 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse" />
            <span className="absolute -right-3 top-1/2 w-2 h-2 bg-white rounded-full opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </motion.p>
          <motion.p
            className="text-sm md:text-base text-gray-400 mb-12 max-w-2xl mx-auto font-light tracking-wider uppercase"
            style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '0.1em',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Advanced Trajectory Analysis • AI-Powered Conflict Detection • Smart Resolution
          </motion.p>
        </motion.div>

      </section>

      {/* Mission & Purpose Section */}
      <section className="relative min-h-screen flex items-center justify-center z-10 bg-gradient-to-b from-transparent via-black/30 to-transparent">
        <motion.div
          className="max-w-5xl mx-auto px-6 py-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Our Mission
            </h2>
            <div className="w-24 h-1 bg-white mx-auto mb-8"></div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h3 className="text-3xl font-semibold text-white mb-4">Our Purpose</h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                ConflictZero is dedicated to revolutionizing air traffic management through advanced 
                trajectory analysis and intelligent conflict detection. We provide air traffic planners 
                with real-time insights and actionable solutions to ensure safe, efficient, and cost-effective 
                flight operations across Canadian airspace.
              </p>
            </motion.div>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <h3 className="text-3xl font-semibold text-white mb-4">Our Vision</h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                To become the leading platform for predictive flight trajectory analysis, enabling 
                proactive conflict resolution and optimizing airspace utilization. We envision a future 
                where air traffic management is seamlessly integrated with AI-powered insights, reducing 
                delays, minimizing costs, and maximizing safety for all stakeholders.
              </p>
            </motion.div>
          </div>

          <motion.div
            className="mt-16 p-8 bg-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-700/30"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h3 className="text-2xl font-semibold text-white mb-6 text-center">Our Core Values</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Safety First',
                  description: 'Prioritizing the safety of passengers, crew, and aircraft above all else.',
                },
                {
                  title: 'Innovation',
                  description: 'Leveraging cutting-edge technology and AI to solve complex airspace challenges.',
                },
                {
                  title: 'Efficiency',
                  description: 'Optimizing flight operations to reduce costs and environmental impact.',
                },
              ].map((value, i) => (
                <motion.div
                  key={i}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.8 + i * 0.1 }}
                >
                  <h4 className="text-xl font-semibold text-white mb-3">{value.title}</h4>
                  <p className="text-gray-400 text-sm">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Globe Section - scales up as you scroll, button appears when fully visible */}
      <section ref={imageRef} className="relative min-h-screen flex items-center justify-center z-10 overflow-hidden">
        {/* Image container - behind button */}
        <motion.div
          className="absolute inset-0 w-full h-full flex items-center justify-center"
          style={{
            scale: imageScale,
            zIndex: 1,
          }}
        >
          <motion.div
            className="relative w-full h-full flex items-center justify-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ zIndex: 1 }}
          >
            <img
              src="/globe.png"
              alt="Globe"
              className="w-full h-full object-contain object-center"
              style={{
                objectPosition: 'center center',
                maxWidth: '100%',
                maxHeight: '100%',
                zIndex: 1,
                position: 'relative',
              }}
              onError={(e) => {
                console.error('Image not found. Please add globe.png to the public folder.')
                e.currentTarget.style.display = 'none'
              }}
            />
          </motion.div>
        </motion.div>
        
        {/* Button appears when globe is fully visible - positioned above everything */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            zIndex: 9999,
            position: 'relative',
          }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/globe" style={{ zIndex: 9999, position: 'relative' }}>
            <motion.button
              className="px-10 py-4 bg-white text-black text-base font-bold rounded-full shadow-2xl hover:shadow-white/50 transition-all duration-300 border-2 border-white/20 backdrop-blur-sm"
              style={{
                zIndex: 9999,
                position: 'relative',
              }}
              whileHover={{ scale: 1.1, backgroundColor: '#f9fafb', boxShadow: '0 25px 50px rgba(255, 255, 255, 0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              Explore the Globe
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1">
              <h3 className="text-2xl font-bold text-white mb-4">ConflictZero</h3>
              <p className="text-gray-400 text-sm">
                Advanced Flight Trajectory Analysis & Conflict Resolution
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/globe" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Globe Visualization
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2">
                <li>
                  <a href="mailto:info@conflictzero.com" className="text-gray-400 hover:text-white transition-colors text-sm">
                    info@conflictzero.com
                  </a>
                </li>
                <li className="text-gray-400 text-sm">
                  uOttawaHack8
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} ConflictZero. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}
