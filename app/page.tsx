"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CauldronMap } from "@/components/cauldron-map"
import { CauldronGrid } from "@/components/cauldron-grid"
import { DiscrepancyPanel } from "@/components/discrepancy-panel"
import { HistoricalPlayback } from "@/components/historical-playback"
import { RouteOptimizer } from "@/components/route-optimizer"
import { AlertTriangle, Activity, Map, History, Route, Loader2, TrendingUp } from "lucide-react"
import { useCauldronData } from "@/hooks/use-cauldron-data"
import { AIAssistant } from "@/components/ai-assistant"
import { DataQuery } from "@/components/data-query"
import { SmartAlerts } from "@/components/smart-alerts"
import { PredictiveAnalytics } from "@/components/predictive-analytics"

export default function DashboardPage() {
  const { cauldrons, tickets, discrepancies, stats, timeSeriesData, market, network, couriers, loading } =
    useCauldronData()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Loading potion factory data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0">
              <Image 
                src="/icon.png" 
                alt="GitBrew Logo" 
                width={200} 
                height={200}
                className="object-contain"
                unoptimized
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">GitBrew</h1>
                <p className="text-sm text-muted-foreground">Real-time Monitoring Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Active Cauldrons</div>
                <div className="text-2xl font-bold text-foreground">{stats.activeCauldrons}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Volume</div>
                <div className="text-2xl font-bold text-foreground">{stats.totalVolume}L</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Discrepancies</div>
                <div className="text-2xl font-bold text-destructive">{discrepancies.length}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Smart Alerts */}
        <SmartAlerts 
          cauldrons={cauldrons} 
          tickets={tickets} 
          discrepancies={discrepancies}
          timeSeriesData={timeSeriesData}
        />

        {/* Alert Banner */}
        {discrepancies.length > 0 && (
          <Card className="mb-6 border-destructive bg-destructive/10 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h3 className="font-semibold text-foreground">Suspicious Activity Detected</h3>
                <p className="text-sm text-muted-foreground">
                  {discrepancies.length} discrepancies found in potion transport tickets
                </p>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <Map className="h-4 w-4" />
              Network Map
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Historical
            </TabsTrigger>
            <TabsTrigger value="discrepancies" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Discrepancies
            </TabsTrigger>
            <TabsTrigger value="routes" className="gap-2">
              <Route className="h-4 w-4" />
              Routes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DataQuery 
              cauldrons={cauldrons} 
              tickets={tickets} 
              discrepancies={discrepancies}
              stats={stats}
            />
            <CauldronGrid cauldrons={cauldrons} />
          </TabsContent>

          <TabsContent value="map">
            <CauldronMap cauldrons={cauldrons} market={market} />
          </TabsContent>

          <TabsContent value="history">
            <HistoricalPlayback cauldrons={cauldrons} timeSeriesData={timeSeriesData} tickets={tickets} />
          </TabsContent>

          <TabsContent value="discrepancies">
            <DiscrepancyPanel discrepancies={discrepancies} tickets={tickets} />
          </TabsContent>

          <TabsContent value="routes">
            <RouteOptimizer cauldrons={cauldrons} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PredictiveAnalytics 
              cauldrons={cauldrons}
              timeSeriesData={timeSeriesData}
            />
          </TabsContent>

        </Tabs>

        {/* AI Assistant - Floating widget */}
        <AIAssistant 
          cauldrons={cauldrons}
          tickets={tickets}
          discrepancies={discrepancies}
          stats={stats}
        />
      </main>
    </div>
  )
}
