"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, Clock } from "lucide-react"
import type { Cauldron, TimeSeriesPoint } from "@/types/cauldron"

interface PredictiveAnalyticsProps {
  cauldrons: Cauldron[]
  timeSeriesData: TimeSeriesPoint[]
}

interface Prediction {
  cauldronId: string
  cauldronName: string
  prediction: string
  timeToEmpty?: number
  timeToFull?: number
  confidence: string
}

export function PredictiveAnalytics({ cauldrons, timeSeriesData }: PredictiveAnalyticsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const generatePredictions = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/gemini/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cauldrons: cauldrons.map(c => ({
            id: c.id,
            name: c.name,
            currentLevel: c.currentLevel,
            maxVolume: c.maxVolume,
            fillRate: c.fillRate,
            drainRate: c.drainRate,
          })),
          recentData: timeSeriesData.slice(-20),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate predictions")
      }

      const data = await response.json()
      setPredictions(data.predictions || [])
    } catch (error: any) {
      console.error("Error generating predictions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Predictive Analytics</h2>
        </div>
        <Button onClick={generatePredictions} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Generate Predictions"
          )}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        AI-powered forecasts for cauldron levels and optimal transport timing
      </p>

      {predictions.length > 0 && (
        <div className="space-y-3">
          {predictions.map((pred, i) => (
            <Card key={i} className="p-4 bg-muted">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground">{pred.cauldronName}</h3>
                <span className="text-xs text-muted-foreground">{pred.confidence}</span>
              </div>
              <p className="text-sm text-foreground mb-2">{pred.prediction}</p>
              {pred.timeToEmpty && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Will be empty in ~{Math.round(pred.timeToEmpty)} minutes
                </div>
              )}
              {pred.timeToFull && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Will be full in ~{Math.round(pred.timeToFull)} minutes
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {predictions.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Click "Generate Predictions" to get AI-powered forecasts</p>
        </div>
      )}
    </Card>
  )
}

