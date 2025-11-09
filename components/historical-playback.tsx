"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import type { Cauldron, TimeSeriesPoint, TransportTicket } from "@/types/cauldron"
import { Package } from "lucide-react"

interface HistoricalPlaybackProps {
  cauldrons: Cauldron[]
  timeSeriesData: TimeSeriesPoint[]
  tickets: TransportTicket[]
}

// Color palette (still used for ticket color coding)
const cauldronColors = [
  '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4',
  '#ec4899', '#0ea5e9', '#f97316', '#84cc16', '#6366f1', '#14b8a6',
]

export function HistoricalPlayback({ cauldrons, tickets }: HistoricalPlaybackProps) {
  // Sort tickets by date (most recent first)
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })
  }, [tickets])

  return (
    <div className="space-y-6">
      {/* Removed graphs section */}

      {/* Transport Ticket Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Transport Ticket Activity
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Recent potion transport tickets ({tickets.length} total tickets)
        </p>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {sortedTickets.map((ticket) => {
            const cauldron = cauldrons.find(c => c.id === ticket.cauldronId)
            const colorIndex = cauldrons.findIndex(c => c.id === ticket.cauldronId)
            const color = cauldronColors[colorIndex % cauldronColors.length]

            return (
              <Card key={ticket.id} className="p-4 border-l-4" style={{ borderLeftColor: color }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: color }}
                      />
                      <div className="font-semibold text-foreground">{ticket.cauldronName}</div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Ticket ID: {ticket.id}</div>
                      <div className="flex items-center gap-4">
                        <span>Date: {new Date(ticket.date).toLocaleDateString()}</span>
                        {ticket.courierName && (
                          <span>Courier: {ticket.courierName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{ticket.volume.toFixed(2)}L</div>
                    {cauldron && (
                      <div className="text-xs text-muted-foreground">
                        {((ticket.volume / cauldron.maxVolume) * 100).toFixed(1)}% of max
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </Card>
    </div>
  )
}