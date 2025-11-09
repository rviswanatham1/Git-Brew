"use client"

import { useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Cauldron } from "@/types/cauldron"
import { MapPin, Store } from "lucide-react"
import config from "@/data/config.json"
import ticketsData from "@/data/transport-tickets.json"

interface CauldronMapProps {
  cauldrons: Cauldron[]
  market?: { latitude: number; longitude: number; name: string }
}

export function CauldronMap({ cauldrons, market }: CauldronMapProps) {
  const marketName = market?.name || "Enchanted Market"

  // Topographical circular arrangement
  const center = { x: 50, y: 50 }
  const radius = 35

  const cauldronPositions = cauldrons.map((c, i) => {
    const angle = (i / cauldrons.length) * 2 * Math.PI
    const x = center.x + radius * Math.cos(angle)
    const y = center.y + radius * Math.sin(angle)
    return { ...c, position: { x, y } }
  })

  const marketPos = { x: center.x, y: center.y }

  const tickets = ticketsData.transport_tickets
  const uniqueDates = Array.from(new Set(tickets.map((t) => t.date))).sort()
  const [currentDateIndex, setCurrentDateIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  // Sort tickets by ticket_id to ensure consistent order matching the data file
  const sortedTickets = [...tickets].sort((a, b) => a.ticket_id.localeCompare(b.ticket_id))
  const dailyTickets = uniqueDates.map((date) => 
    sortedTickets.filter((t) => t.date === date)
  )

  const [courierPositions, setCourierPositions] = useState<{ [id: string]: { x: number; y: number; ticket: any } }>({})

  // Track trip progress for each courier using ref to avoid dependency issues
  const tripProgressRef = useRef<Record<string, { ticketIndex: number; startTime: number }>>({})
  const lastDateIndexRef = useRef(currentDateIndex)
  const initializedRef = useRef(false)

  useEffect(() => {
    // Reset trip progress when date changes or on initial load
    // This ensures animation starts fresh from the beginning of the data
    if (lastDateIndexRef.current !== currentDateIndex || !initializedRef.current) {
      tripProgressRef.current = {}
      setCourierPositions({})
      lastDateIndexRef.current = currentDateIndex
      initializedRef.current = true
    }
  }, [currentDateIndex])

  useEffect(() => {
    let frame = 0
    const interval = setInterval(() => {
      if (!isPlaying) return
      frame += 1
      if (frame % 60 === 0) {
        setCurrentDateIndex((i) => (i + 1) % uniqueDates.length)
      }

      const todayTickets = dailyTickets[currentDateIndex] || []
      const newPositions: Record<string, { x: number; y: number; ticket: any }> = {}

      // Group tickets by courier_id, maintaining the sorted order from the data
      const courierGroups = new Map<string, typeof todayTickets>()
      todayTickets.forEach((ticket) => {
        if (!courierGroups.has(ticket.courier_id)) {
          courierGroups.set(ticket.courier_id, [])
        }
        courierGroups.get(ticket.courier_id)!.push(ticket)
      })

      const now = Date.now()

      // Always show all 5 couriers, cycling through all cauldrons
      config.couriers.forEach((courier, courierIndex) => {
        const courierId = courier.courier_id
        const ticketsForCourier = courierGroups.get(courierId) || []

        // Get or initialize trip progress for this courier
        let currentProgress = tripProgressRef.current[courierId]
        if (!currentProgress) {
          currentProgress = { ticketIndex: 0, startTime: now }
          tripProgressRef.current[courierId] = currentProgress
        }

        let ticket: any = null
        let from: (typeof cauldronPositions[0]) | undefined = undefined
        let travelTimeMinutes = 30

        // If there are tickets for this courier, use them
        if (ticketsForCourier.length > 0 && currentProgress.ticketIndex < ticketsForCourier.length) {
          ticket = ticketsForCourier[currentProgress.ticketIndex]
          from = cauldronPositions.find((c) => c.id === ticket.cauldron_id)
          if (from) {
            const edge = config.network.edges.find(
              (e) => e.from === ticket.cauldron_id && e.to === "market_001"
            )
            travelTimeMinutes = edge?.travel_time_minutes || 30
          }
        } else {
          // No tickets or all tickets done - cycle through all cauldrons
          // Distribute cauldrons among couriers so each courier gets different ones
          const cauldronIndex = (currentProgress.ticketIndex + courierIndex * 2) % cauldronPositions.length
          from = cauldronPositions[cauldronIndex]
          if (from) {
            const edge = config.network.edges.find(
              (e) => e.from === from!.id && e.to === "market_001"
            )
            travelTimeMinutes = edge?.travel_time_minutes || 30
            // Create a synthetic ticket for visualization
            ticket = {
              ticket_id: `synthetic_${courierId}_${cauldronIndex}`,
              cauldron_id: from.id,
              courier_id: courierId,
              date: uniqueDates[currentDateIndex],
            }
          }
        }

        if (!from) return

        const to = marketPos
        const travelTimeMs = travelTimeMinutes * 100 // Scale: 1 minute = 100ms for animation

        // Calculate progress (0 to 1) - one-way trip only
        const elapsed = now - currentProgress.startTime
        let progress = Math.min(elapsed / travelTimeMs, 1)

        // If trip is complete, start next trip
        if (progress >= 1) {
          const nextTicketIndex = currentProgress.ticketIndex + 1
          tripProgressRef.current[courierId] = {
            ticketIndex: nextTicketIndex,
            startTime: now,
          }
          progress = 0 // Start at cauldron for new trip
        }

        // Calculate position (one-way: cauldron to market)
        const x = from.position.x + (to.x - from.position.x) * progress
        const y = from.position.y + (to.y - from.position.y) * progress

        newPositions[courierId] = { x, y, ticket }
      })

      setCourierPositions(newPositions)
    }, 30)
    return () => clearInterval(interval)
  }, [isPlaying, currentDateIndex, cauldronPositions, marketPos, dailyTickets, uniqueDates])

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-foreground">Network Topology</h2>
        <p className="text-sm text-muted-foreground">
          Potion distribution network with cauldrons and market connections
        </p>
      </div>

      <div className="relative bg-muted rounded-lg" style={{ height: "600px" }}>
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Connection lines to market and between cauldrons */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Straight lines directly from each cauldron to the market */}
          {cauldronPositions.map((cauldron) => {
            const pos = cauldron.position
            const edge = config.network.edges.find(
              (e) => e.from === cauldron.id && e.to === "market_001"
            )
            const travelTime = edge?.travel_time_minutes || 0
            const midX = (pos.x + marketPos.x) / 2
            const midY = (pos.y + marketPos.y) / 2
            
            return (
              <g key={`market-${cauldron.id}`}>
                <line
                  x1={`${pos.x}%`}
                  y1={`${pos.y}%`}
                  x2={`${marketPos.x}%`}
                  y2={`${marketPos.y}%`}
                  stroke="#ef4444"
                  strokeWidth="3"
                  opacity="0.8"
                />
                {travelTime > 0 && (
                  <text
                    x={`${midX}%`}
                    y={`${midY}%`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      pointerEvents: "none",
                      textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    }}
                  >
                    {travelTime}m
                  </text>
                )}
              </g>
            )
          })}

          {config.network.edges
            .filter((edge) => edge.from !== "market_001" && edge.to !== "market_001")
            .map((edge) => {
              const from = cauldronPositions.find((c) => c.id === edge.from)
              const to = cauldronPositions.find((c) => c.id === edge.to)
              if (!from || !to) return null
              const fromPos = from.position
              const toPos = to.position
              const midX = (fromPos.x + toPos.x) / 2
              const midY = (fromPos.y + toPos.y) / 2
              
              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <line
                    x1={`${fromPos.x}%`}
                    y1={`${fromPos.y}%`}
                    x2={`${toPos.x}%`}
                    y2={`${toPos.y}%`}
                    stroke="hsl(180 50% 60%)"
                    strokeWidth="2"
                    opacity="0.4"
                  />
                  {edge.travel_time_minutes && (
                    <text
                      x={`${midX}%`}
                      y={`${midY}%`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs fill-foreground font-semibold"
                      style={{
                        fontSize: "9px",
                        pointerEvents: "none",
                      }}
                    >
                      {edge.travel_time_minutes}m
                    </text>
                  )}
                </g>
              )
            })}

        </svg>

        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: `${marketPos.x}%`,
            top: `${marketPos.y}%`,
          }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-amber-500 border-4 border-black text-white p-6 rounded-full shadow-lg">
              <Store className="h-8 w-8" />
            </div>
            <div className="text-sm font-bold text-foreground mt-3">Market</div>
          </div>
        </div>

        {/* Witch icons (couriers) */}
        {Object.entries(courierPositions).map(([courierId, pos]) => {
          if (!pos || !pos.ticket) return null
          const ticket = pos.ticket
          
          const cauldron = cauldronPositions.find((c) => c.id === ticket.cauldron_id)
          const courier = config.couriers.find((c) => c.courier_id === courierId)
          const courierName = courier?.name || courierId
          const tooltip = `${courierName} from ${cauldron?.name || ticket.cauldron_id}`
          
          return (
            <div
              key={courierId}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-[15] group"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
              }}
              title={tooltip}
            >
              <div className="w-6 h-6 bg-pink-500 rounded-full border-2 border-black shadow-lg"></div>
            </div>
          )
        })}

        {cauldronPositions.map((cauldron) => {
          const pos = cauldron.position
          const fillPercentage = (cauldron.currentLevel / cauldron.maxVolume) * 100
          const isNearFull = fillPercentage > 85

          return (
            <div
              key={cauldron.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-20"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
              }}
            >
              <div className="relative">
                <div
                  className={`p-4 rounded-full shadow-lg border-4 border-black ${isNearFull ? "bg-destructive" : "bg-purple-500"}`}
                >
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white font-bold">
                  {cauldron.name}
                </Badge>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                  <Card className="p-3 min-w-[200px] shadow-xl">
                    <div className="text-sm font-semibold text-foreground mb-1">{cauldron.name}</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        Level: {cauldron.currentLevel.toFixed(1)}L / {cauldron.maxVolume}L
                      </div>
                      <div>Fill: {fillPercentage.toFixed(1)}%</div>
                      <div>Rate: {(cauldron.fillRate * 60).toFixed(1)}L/hr</div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="px-3 py-1 bg-foreground text-background rounded font-bold"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <span className="text-sm text-muted-foreground font-medium">
            {uniqueDates[currentDateIndex]}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max={uniqueDates.length - 1}
          value={currentDateIndex}
          onChange={(e) => setCurrentDateIndex(Number(e.target.value))}
          className="w-2/3 accent-purple-600"
        />
      </div>

    </Card>
  )
}
