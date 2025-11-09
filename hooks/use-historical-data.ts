"use client"

import { useState, useEffect } from "react"
import type { TimeSeriesPoint, TransportTicket } from "@/types/cauldron"

/**
 * useHistoricalData
 * ---------------------------------------
 * Fetches full historical potion level data and transport tickets once.
 * Used for static graphs (no live refreshing).
 */
export function useHistoricalData() {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([])
  const [tickets, setTickets] = useState<TransportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStaticData() {
      try {
        // Fetch full historical potion data + all transport tickets
        const [levelsRes, ticketsRes] = await Promise.all([
          fetch("/api/historical-levels"),
          fetch("/api/transport-tickets"),
        ])

        if (!levelsRes.ok || !ticketsRes.ok) {
          throw new Error("Failed to fetch historical data or tickets.")
        }

        const levelsJson = await levelsRes.json()
        const ticketsJson = await ticketsRes.json()

        // Expect structure: { transport_tickets: [...] }
        setTimeSeriesData(levelsJson)
        setTickets(ticketsJson.transport_tickets || [])
      } catch (err: any) {
        console.error("Error fetching historical data:", err)
        setError(err.message || "Unknown error fetching historical data")
      } finally {
        setLoading(false)
      }
    }

    fetchStaticData()
  }, [])

  return {
    timeSeriesData,
    tickets,
    loading,
    error,
  }
}