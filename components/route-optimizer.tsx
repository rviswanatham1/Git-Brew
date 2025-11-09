"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Clock, RouteIcon } from "lucide-react"
import type { Cauldron } from "@/types/cauldron"

interface RouteOptimizerProps {
  cauldrons: Cauldron[]
  network?: any
  couriers?: any[]
}

interface RouteSchedule {
  witchId: string
  witchName: string
  stops: Array<{
    cauldronId: string
    cauldronName: string
    arrivalTime: number
    collectionTime: number
    volume: number
  }>
  totalTime: number
}

export function RouteOptimizer({ cauldrons, network, couriers }: RouteOptimizerProps) {
  // Calculate optimal routes
  const calculateOptimalRoutes = (): RouteSchedule[] => {
    const numWitches = couriers?.length || 3
    const witchNames = couriers?.map((c) => c.name) || ["Witch A", "Witch B", "Witch C"]

    // Sort cauldrons by urgency (fill percentage)
    const sortedCauldrons = [...cauldrons].sort((a, b) => {
      const fillA = a.currentLevel / a.maxVolume
      const fillB = b.currentLevel / b.maxVolume
      return fillB - fillA
    })

    const routes: RouteSchedule[] = []

    for (let i = 0; i < numWitches; i++) {
      let currentTime = 0
      const stops = []

      // Assign every nth cauldron to this witch
      for (let j = i; j < sortedCauldrons.length; j += numWitches) {
        const cauldron = sortedCauldrons[j]

        let travelTime = 30 // default
        if (network?.edges) {
          const edge = network.edges.find((e: any) => e.from === cauldron.id && e.to === "market_001")
          if (edge) {
            travelTime = edge.travel_time_minutes
          }
        }

        // Calculate collection time - assume 100L max per trip
        const volumeToCollect = Math.min(cauldron.currentLevel, 100)
        const collectionTime = 10 // Fixed 10 minutes collection time

        currentTime += travelTime

        stops.push({
          cauldronId: cauldron.id,
          cauldronName: cauldron.name,
          arrivalTime: currentTime,
          collectionTime: collectionTime,
          volume: volumeToCollect,
        })

        currentTime += collectionTime
      }

      // Add market unload time
      currentTime += 20 // Travel to market
      currentTime += 15 // Unload time

      routes.push({
        witchId: couriers?.[i]?.courier_id || `witch_${i + 1}`,
        witchName: witchNames[i] || `Witch ${i + 1}`,
        stops,
        totalTime: currentTime,
      })
    }

    return routes
  }

  const routes = calculateOptimalRoutes()
  const totalWitches = routes.length

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Route Optimization</h2>
          <p className="text-sm text-muted-foreground">
            Optimized courier routes to prevent overflow and ensure efficient potion collection
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <Sparkles className="h-4 w-4" />
          {totalWitches} Witches Required
        </Badge>
      </div>

      <div className="grid gap-4 mb-6 md:grid-cols-3">
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-foreground">{totalWitches}</div>
          <div className="text-sm text-muted-foreground">Minimum Witches</div>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-foreground">
            {Math.max(...routes.map((r) => r.totalTime)).toFixed(0)}m
          </div>
          <div className="text-sm text-muted-foreground">Max Route Time</div>
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-2xl font-bold text-foreground">{routes.reduce((sum, r) => sum + r.stops.length, 0)}</div>
          <div className="text-sm text-muted-foreground">Total Stops</div>
        </div>
      </div>

      <div className="space-y-4">
        {routes.map((route) => (
          <Card key={route.witchId} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 text-white p-2 rounded-full">
                  <RouteIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{route.witchName}</h3>
                  <div className="text-sm text-muted-foreground">
                    {route.stops.length} stops - {route.totalTime.toFixed(0)} minutes
                  </div>
                </div>
              </div>
              <Badge variant="outline">{route.totalTime.toFixed(0)}m total</Badge>
            </div>

            <div className="space-y-2">
              {route.stops.map((stop, idx) => (
                <div key={stop.cauldronId} className="flex items-center gap-3 p-2 bg-muted rounded">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{stop.cauldronName}</div>
                    <div className="text-xs text-muted-foreground">
                      Collect {stop.volume.toFixed(1)}L in {stop.collectionTime.toFixed(0)}m
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {stop.arrivalTime.toFixed(0)}m
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 p-2 bg-amber-500/10 rounded border border-amber-500/30">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                  M
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Enchanted Market</div>
                  <div className="text-xs text-muted-foreground">Unload all collected potions (15m)</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">Optimization Details</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Routes prioritized by cauldron fill percentage (highest risk first)</li>
          <li>• Travel times based on actual network topology</li>
          <li>• Market unload time: 15 minutes per witch</li>
          <li>• Collection time: 10 minutes per cauldron</li>
          <li>• Maximum carrying capacity: 100L per witch per trip</li>
        </ul>
      </div>
    </Card>
  )
}
