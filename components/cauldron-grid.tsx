"use client"

import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Droplet, TrendingUp, AlertCircle } from "lucide-react"
import type { Cauldron } from "@/types/cauldron"
import { useEffect, useState } from "react"

interface CauldronGridProps {
  cauldrons: Cauldron[]
}

export function CauldronGrid({ cauldrons }: CauldronGridProps) {
  // Optional: local state to animate transitions
  const [animatedCauldrons, setAnimatedCauldrons] = useState(cauldrons)

  // Whenever new data comes in, update animated state
  useEffect(() => {
    setAnimatedCauldrons(cauldrons)
  }, [cauldrons])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {animatedCauldrons.map((cauldron) => {
        const fillPercentage = (cauldron.currentLevel / cauldron.maxVolume) * 100
        const isNearFull = fillPercentage > 85
        const fillRate = cauldron.fillRate * 60 // per hour

        return (
          <Card key={cauldron.id} className="p-6 transition-all duration-1000 ease-in-out">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg text-foreground">{cauldron.name}</h3>
                <p className="text-sm text-muted-foreground">ID: {cauldron.id}</p>
              </div>
              <Badge variant={isNearFull ? "destructive" : "secondary"}>
                {isNearFull ? "Near Full" : "Active"}
              </Badge>
            </div>

            <div className="space-y-4">
              {/* Level bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Current Level</span>
                  <span className="text-sm font-semibold text-foreground">
                    {cauldron.currentLevel.toFixed(1)}L / {cauldron.maxVolume}L
                  </span>
                </div>
                <div className="w-full bg-purple-950 h-2 rounded">
                  <div
                    className="h-2 bg-purple-500 rounded transition-all duration-1000 ease-out"
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {fillPercentage.toFixed(1)}% full
                </div>
              </div>

              {/* Fill/Drain rates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Fill Rate</div>
                    <div className="text-sm font-medium text-foreground">
                      {fillRate.toFixed(1)}L/hr
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="text-xs text-muted-foreground">Total Drain</div>
                    <div className="text-sm font-medium text-foreground">
                      {cauldron.totalDrain.toFixed(1)}L
                    </div>
                  </div>
                </div>
              </div>

              {/* Overflow alert */}
              {isNearFull && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Overflow risk – Collection needed</span>
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}