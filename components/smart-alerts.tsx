"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, TrendingUp, Clock, Lightbulb, X } from "lucide-react"
import type { Cauldron, TransportTicket, Discrepancy } from "@/types/cauldron"

interface SmartAlertsProps {
  cauldrons: Cauldron[]
  tickets: TransportTicket[]
  discrepancies: Discrepancy[]
  timeSeriesData: any[]
}

interface Alert {
  id: string
  type: "warning" | "info" | "success" | "critical"
  title: string
  message: string
  recommendation?: string
  timestamp: Date
}

export function SmartAlerts({ cauldrons, tickets, discrepancies, timeSeriesData }: SmartAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  useEffect(() => {
    generateAlerts()
  }, [cauldrons, tickets, discrepancies, timeSeriesData])

  const generateAlerts = async () => {
    try {
      // Analyze data for alerts
      const lowVolumeCauldrons = cauldrons.filter(c => c.currentLevel < c.maxVolume * 0.2)
      const highVolumeCauldrons = cauldrons.filter(c => c.currentLevel > c.maxVolume * 0.9)
      const recentDiscrepancies = discrepancies.slice(0, 5)
      
      const newAlerts: Alert[] = []

      // Low volume alerts
      lowVolumeCauldrons.forEach(cauldron => {
        const timeToEmpty = cauldron.currentLevel / Math.max(cauldron.drainRate || 0.1, 0.1)
        newAlerts.push({
          id: `low-${cauldron.id}`,
          type: timeToEmpty < 60 ? "critical" : "warning",
          title: `${cauldron.name} Running Low`,
          message: `Current level: ${cauldron.currentLevel.toFixed(1)}L (${((cauldron.currentLevel / cauldron.maxVolume) * 100).toFixed(1)}% of max)`,
          recommendation: timeToEmpty < 60 
            ? `⚠️ Critical: Will be empty in ${Math.round(timeToEmpty)} minutes!`
            : `Will be empty in approximately ${Math.round(timeToEmpty)} minutes`,
          timestamp: new Date(),
        })
      })

      // High volume alerts
      highVolumeCauldrons.forEach(cauldron => {
        newAlerts.push({
          id: `high-${cauldron.id}`,
          type: "info",
          title: `${cauldron.name} Nearly Full`,
          message: `Current level: ${cauldron.currentLevel.toFixed(1)}L (${((cauldron.currentLevel / cauldron.maxVolume) * 100).toFixed(1)}% of max)`,
          recommendation: "Consider scheduling a transport ticket soon",
          timestamp: new Date(),
        })
      })

      // Discrepancy alerts
      if (recentDiscrepancies.length > 0) {
        newAlerts.push({
          id: "discrepancies",
          type: "warning",
          title: `${recentDiscrepancies.length} Recent Discrepancies`,
          message: "Suspicious activity detected in transport tickets",
          recommendation: "Review discrepancy details and investigate potential issues",
          timestamp: new Date(),
        })
      }

      // Get AI recommendations
      if (newAlerts.length > 0) {
        try {
          const response = await fetch("/api/gemini/insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "recommendation",
              data: {
                cauldrons: cauldrons.map(c => ({
                  name: c.name,
                  level: c.currentLevel,
                  maxVolume: c.maxVolume,
                  fillRate: c.fillRate,
                })),
                recentTickets: tickets.slice(0, 10),
                discrepancies: recentDiscrepancies.length,
              },
            }),
          })
          const data = await response.json()
          if (data.insight) {
            newAlerts.push({
              id: "ai-recommendation",
              type: "info",
              title: "AI Recommendations",
              message: data.insight,
              timestamp: new Date(),
            })
          }
        } catch (error) {
          console.error("Error fetching AI recommendations:", error)
        }
      }

      setAlerts(newAlerts)
    } catch (error) {
      console.error("Error generating alerts:", error)
    }
  }

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set(prev).add(id))
  }

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id))

  if (visibleAlerts.length === 0) return null

  const getIcon = (type: string) => {
    switch (type) {
      case "critical": return <AlertTriangle className="h-5 w-5 text-red-500" />
      case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "info": return <Lightbulb className="h-5 w-5 text-blue-500" />
      case "success": return <TrendingUp className="h-5 w-5 text-green-500" />
      default: return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "critical": return "destructive"
      case "warning": return "default"
      case "info": return "secondary"
      case "success": return "default"
      default: return "default"
    }
  }

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Smart Alerts & Recommendations
        </h3>
        <Badge variant="secondary">{visibleAlerts.length} active</Badge>
      </div>
      <div className="space-y-3">
        {visibleAlerts.map(alert => (
          <Card key={alert.id} className={`p-4 border-l-4 ${
            alert.type === "critical" ? "border-red-500 bg-red-500/10" :
            alert.type === "warning" ? "border-yellow-500 bg-yellow-500/10" :
            alert.type === "info" ? "border-blue-500 bg-blue-500/10" :
            "border-green-500 bg-green-500/10"
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getIcon(alert.type)}
                  <h4 className="font-semibold text-foreground">{alert.title}</h4>
                  <Badge variant={getBadgeColor(alert.type) as any} className="text-xs">
                    {alert.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                {alert.recommendation && (
                  <div className="mt-2 p-2 bg-background/50 rounded text-xs text-foreground">
                    <strong>💡 Recommendation:</strong> {alert.recommendation}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => dismissAlert(alert.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}

