"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle } from "lucide-react"
import type { Discrepancy, TransportTicket } from "@/types/cauldron"

interface DiscrepancyPanelProps {
  discrepancies: Discrepancy[]
  tickets: TransportTicket[]
}

export function DiscrepancyPanel({ discrepancies, tickets }: DiscrepancyPanelProps) {
  const validTickets = tickets.filter((t) => !discrepancies.find((d) => d.ticketId === t.id))

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Discrepancy Detection</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Comparing transport tickets against actual drain events to identify suspicious activity
        </p>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-foreground">{tickets.length}</div>
            <div className="text-sm text-muted-foreground">Total Tickets</div>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg">
            <div className="text-2xl font-bold text-green-500">{validTickets.length}</div>
            <div className="text-sm text-muted-foreground">Valid Tickets</div>
          </div>
          <div className="p-4 bg-destructive/10 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{discrepancies.length}</div>
            <div className="text-sm text-muted-foreground">Suspicious Tickets</div>
          </div>
        </div>

        {discrepancies.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Suspicious Activity Detected
            </h3>
            <div className="space-y-3">
              {discrepancies.map((discrepancy) => {
                const ticket = tickets.find((t) => t.id === discrepancy.ticketId)
                if (!ticket) return null

                return (
                  <Card key={discrepancy.id} className="p-4 border-destructive">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold text-foreground">Ticket #{ticket.id}</div>
                        <div className="text-sm text-muted-foreground">
                          {ticket.cauldronName} - {new Date(ticket.date).toLocaleDateString()}
                        </div>
                        {ticket.courierName && (
                          <div className="text-xs text-muted-foreground mt-1">Courier: {ticket.courierName}</div>
                        )}
                      </div>
                      <Badge variant="destructive">{discrepancy.type}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Ticket Volume</div>
                        <div className="font-semibold text-foreground">{ticket.volume}L</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Actual Drain</div>
                        <div className="font-semibold text-foreground">{discrepancy.actualVolume}L</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Difference</div>
                        <div className="font-semibold text-destructive">
                          {discrepancy.difference > 0 ? "+" : ""}
                          {discrepancy.difference}L
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-sm text-muted-foreground">{discrepancy.description}</div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {validTickets.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Valid Transport Tickets
            </h3>
            <div className="space-y-2">
              {validTickets.map((ticket) => (
                <Card key={ticket.id} className="p-3 border-green-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="font-medium text-sm text-foreground">
                          Ticket #{ticket.id} - {ticket.cauldronName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(ticket.date).toLocaleDateString()}
                          {ticket.courierName && ` • ${ticket.courierName}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground">{ticket.volume}L</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
