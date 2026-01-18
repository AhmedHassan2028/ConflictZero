'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import Link from 'next/link'
import flightData from '../../canadian_flights_250.json'

const Globe = dynamic(
    () => import('react-globe.gl').catch((err) => {
        console.error('Failed to load Globe:', err)
        return { default: () => <div>Globe loading...</div> }
    }),
    {
        ssr: false,
        loading: () => <div className="text-white">Loading globe...</div>,
    }
)

interface Flight {
    ACID: string
    'Plane type': string
    route: string
    altitude: number
    'departure airport': string
    'arrival airport': string
    'departure time': number
    'aircraft speed': number
    passengers: number
    is_cargo: boolean
}

const airports: Record<string, [number, number]> = {
    CYYZ: [43.68, -79.63],
    CYVR: [49.19, -123.18],
    CYUL: [45.47, -73.74],
    CYYC: [51.11, -114.02],
    CYOW: [45.32, -75.67],
    CYWG: [49.91, -97.24],
    CYHZ: [44.88, -63.51],
    CYEG: [53.31, -113.58],
    CYQB: [46.79, -71.39],
    CYYJ: [48.65, -123.43],
    CYYT: [47.62, -52.75],
    CYXE: [52.17, -106.70],
}

function parseWaypoint(waypoint: string): [number, number] | null {
    const match = waypoint.match(/(\d+\.?\d*)N\/(\d+\.?\d*)W/)
    if (match) {
        return [parseFloat(match[1]), -parseFloat(match[2])]
    }
    return null
}

export default function GlobePage() {
    const globeEl = useRef<any>(null)
    const [arcs, setArcs] = useState<any[]>([])
    const [points, setPoints] = useState<any[]>([])
    const [conflicts, setConflicts] = useState<any[]>([])
    const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const processedArcs: any[] = []
        const processedPoints: any[] = []
        const conflictPoints: any[] = []

        const flights = flightData as Flight[]

        flights.forEach((flight) => {
            const dep = airports[flight['departure airport']]
            const arr = airports[flight['arrival airport']]
            if (!dep || !arr) return

            // Arcs
            processedArcs.push({
                startLat: dep[0],
                startLng: dep[1],
                endLat: arr[0],
                endLng: arr[1],
                color: flight.is_cargo
                    ? ['rgba(255,100,100,0.6)', 'rgba(255,100,100,0.3)']
                    : ['rgba(100,150,255,0.6)', 'rgba(100,150,255,0.3)'],
                flight,
            })

            // Points: departure and arrival
            processedPoints.push(
                { lat: dep[0], lng: dep[1], size: 0.5, color: '#60a5fa', label: flight['departure airport'], flight },
                { lat: arr[0], lng: arr[1], size: 0.5, color: '#34d399', label: flight['arrival airport'], flight }
            )

            // Waypoints
            flight.route?.split(' ').filter(Boolean).forEach((wp) => {
                const coords = parseWaypoint(wp)
                if (coords) {
                    processedPoints.push({ lat: coords[0], lng: coords[1], size: 0.3, color: '#fbbf24', label: wp, flight })
                }
            })
        })

        // Conflict detection
        const altitudeGroups = new Map<number, Flight[]>()
        flights.forEach((f) => {
            const alt = Math.round(f.altitude / 1000) * 1000
            altitudeGroups.set(alt, [...(altitudeGroups.get(alt) || []), f])
        })

        altitudeGroups.forEach((group) => {
            for (let i = 0; i < group.length; i++) {
                for (let j = i + 1; j < group.length; j++) {
                    const f1 = group[i], f2 = group[j]
                    const d1 = airports[f1['departure airport']]
                    const d2 = airports[f2['departure airport']]
                    if (!d1 || !d2) continue

                    const dist = Math.hypot(d1[0] - d2[0], d1[1] - d2[1])
                    if (dist < 2 && Math.abs(f1.altitude - f2.altitude) < 2000) {
                        conflictPoints.push({
                            lat: (d1[0] + d2[0]) / 2,
                            lng: (d1[1] + d2[1]) / 2,
                            size: 1,
                            color: '#ef4444',
                            label: `Conflict: ${f1.ACID} & ${f2.ACID}`,
                            flights: [f1, f2],
                        })
                    }
                }
            }
        })

        setArcs(processedArcs)
        setPoints(processedPoints)
        setConflicts(conflictPoints)
        setIsLoading(false)
    }, [])

    useEffect(() => {
        if (globeEl.current) {
            globeEl.current.controls().autoRotate = true
            globeEl.current.controls().autoRotateSpeed = 0.5
        }
    }, [])

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* NAV */}
            <motion.nav className="absolute top-0 left-0 right-0 z-50 pt-6" initial={{ y: -100 }} animate={{ y: 0 }}>
                <div className="flex justify-center gap-8 text-white text-sm">
                    <Link href="/">Home</Link>
                    <Link href="/globe">Visualization</Link>
                    <Link href="/analysis">Analysis</Link>
                    <Link href="/about">About</Link>
                    <Link href="/team">Team</Link>
                    <Link href="/contact">Contact</Link>
                </div>
            </motion.nav>

            {/* Globe */}
            <div className="w-full h-full pt-20">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full text-white">Loading flight data...</div>
                ) : (
                    <Globe
                        ref={globeEl}
                        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                        backgroundColor="rgba(0,0,0,0)"
                        arcsData={arcs}
                        arcStartLat={(d: any) => d.startLat}
                        arcStartLng={(d: any) => d.startLng}
                        arcEndLat={(d: any) => d.endLat}
                        arcEndLng={(d: any) => d.endLng}
                        arcColor={(d: any) => d.color}
                        arcDashLength={0.4}
                        arcDashGap={0.2}
                        arcDashAnimateTime={2000}
                        pointsData={[...points, ...conflicts]}
                        pointLat={(d: any) => d.lat}
                        pointLng={(d: any) => d.lng}
                        pointColor={(d: any) => d.color}
                        pointRadius={(d: any) => d.size}
                        pointLabel={(d: any) => d.label || ''}
                        onPointClick={(p: any) => setSelectedFlight(p.flight ?? p.flights?.[0] ?? null)}
                    />
                )}
            </div>

            {/* Legend */}
            <motion.div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm p-4 rounded-lg border border-blue-500/20 z-50"
                initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                <h3 className="text-white font-semibold mb-2">Legend</h3>
                <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400"></div><span className="text-gray-300">Passenger Flight</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div><span className="text-gray-300">Cargo Flight</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400"></div><span className="text-gray-300">Waypoint</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-gray-300">Conflict Zone</span></div>
                </div>
            </motion.div>

            {/* Flight details panel */}
            {selectedFlight && (
                <motion.div className="absolute top-20 right-4 bg-slate-900/90 backdrop-blur-sm p-6 rounded-lg border border-blue-500/20 z-50 max-w-sm"
                    initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                    <button onClick={() => setSelectedFlight(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white">×</button>
                    <h3 className="text-xl font-bold text-white mb-4">{selectedFlight.ACID}</h3>
                    <div className="space-y-2 text-sm">
                        <div><span className="text-gray-400">Aircraft:</span> <span className="text-white">{selectedFlight['Plane type']}</span></div>
                        <div><span className="text-gray-400">Route:</span> <span className="text-white">{selectedFlight['departure airport']} → {selectedFlight['arrival airport']}</span></div>
                        <div><span className="text-gray-400">Altitude:</span> <span className="text-white">{selectedFlight.altitude.toLocaleString()} ft</span></div>
                        <div><span className="text-gray-400">Speed:</span> <span className="text-white">{selectedFlight['aircraft speed']} knots</span></div>
                        <div><span className="text-gray-400">Type:</span> <span className="text-white">{selectedFlight.is_cargo ? 'Cargo' : 'Passenger'}</span></div>
                        {!selectedFlight.is_cargo && (<div><span className="text-gray-400">Passengers:</span> <span className="text-white">{selectedFlight.passengers}</span></div>)}
                    </div>
                </motion.div>
            )}

            {/* Controls hint */}
            <motion.div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg border border-blue-500/20 z-50 text-sm text-gray-300"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                <p>🖱️ Click and drag to rotate</p>
                <p>🔍 Scroll to zoom</p>
            </motion.div>
        </div>
    )
}