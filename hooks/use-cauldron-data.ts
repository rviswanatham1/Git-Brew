"use client"

import { useState, useEffect, useMemo } from "react"
import type { Cauldron, TransportTicket, Discrepancy, TimeSeriesPoint } from "@/types/cauldron"

export function useCauldronData() {
  const [configData, setConfigData] = useState<any>(null)
  const [ticketsData, setTicketsData] = useState<any>(null)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([])
  const [loading, setLoading] = useState(true)

  // ⏱ Fetches data and updates every minute
  useEffect(() => {
    let minute = 0
    let interval: NodeJS.Timeout

    async function fetchData() {
      try {
        // Fetch config + tickets once
        const [configRes, ticketsRes] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/transport-tickets"),
        ])

        const config = await configRes.json()
        const tickets = await ticketsRes.json()
        setConfigData(config)
        setTicketsData(tickets)

        // Fetch first minute of cauldron levels
        const levelsRes = await fetch(`/api/cauldron-levels?minute=${minute}`)
        const firstSnapshot = await levelsRes.json()
        setTimeSeriesData([firstSnapshot])
        setLoading(false)

        // Update every 60 seconds
        interval = setInterval(async () => {
          minute++
          const nextRes = await fetch(`/api/cauldron-levels?minute=${minute}`)
          if (nextRes.ok) {
            const nextSnapshot = await nextRes.json()
            setTimeSeriesData((prev) => [...prev, nextSnapshot])
          }
        }, 100) // 
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
    return () => clearInterval(interval)
  }, [])

  // 🧠 Compute cauldron data
  const cauldrons: Cauldron[] = useMemo(() => {
    if (!configData || timeSeriesData.length === 0) return []

    const latestSnapshot = timeSeriesData[timeSeriesData.length - 1]

    return configData.cauldrons.map((cauldron: any) => {
      const currentLevel = latestSnapshot?.cauldron_levels[cauldron.id] || 0
      const firstLevel = timeSeriesData[0]?.cauldron_levels[cauldron.id] || 0
      const totalMinutes = timeSeriesData.length
      const fillRate = totalMinutes > 0 ? ((currentLevel - firstLevel) / totalMinutes) * 60 : 0

      // Calculate total drain (sum of all decreases)
      let totalDrain = 0;
      for (let i = 1; i < timeSeriesData.length; i++) {
        const prev = timeSeriesData[i - 1]?.cauldron_levels[cauldron.id] || 0;
        const curr = timeSeriesData[i]?.cauldron_levels[cauldron.id] || 0;
        if (curr < prev) totalDrain += prev - curr;
      }

      return {
        id: cauldron.id,
        name: cauldron.name,
        latitude: cauldron.latitude,
        longitude: cauldron.longitude,
        maxVolume: cauldron.max_volume,
        currentLevel: Math.round(currentLevel * 100) / 100,
        fillRate: Math.max(0, Math.round(fillRate * 100) / 100),
        totalDrain: Math.round(totalDrain * 100) / 100,
      }
    })
  }, [configData, timeSeriesData])

  // 🎫 Transport tickets
  const tickets: TransportTicket[] = useMemo(() => {
    if (!configData || !ticketsData) return []

    return ticketsData.transport_tickets.map((ticket: any) => {
      const cauldron = configData.cauldrons.find((c: any) => c.id === ticket.cauldron_id)
      const courier = configData.couriers.find((c: any) => c.courier_id === ticket.courier_id)

      return {
        id: ticket.ticket_id,
        cauldronId: ticket.cauldron_id,
        cauldronName: cauldron?.name || ticket.cauldron_id,
        date: ticket.date,
        volume: Math.round(ticket.amount_collected * 100) / 100,
        courierId: ticket.courier_id,
        courierName: courier?.name || ticket.courier_id,
      }
    })
  }, [configData, ticketsData])

  // ⚠️ Discrepancy detection
  const discrepancies: Discrepancy[] = useMemo(() => {
    if (tickets.length === 0 || timeSeriesData.length === 0) return []

    const found: Discrepancy[] = []

    tickets.forEach((ticket) => {
      const ticketDate = new Date(ticket.date)
      const relevantPoints = timeSeriesData.filter((point) => {
        const pointDate = new Date(point.timestamp)
        const dayDiff = Math.abs(pointDate.getTime() - ticketDate.getTime()) / (1000 * 60 * 60 * 24)
        return dayDiff <= 1
      })

      if (relevantPoints.length < 2) return

      const cauldronId = ticket.cauldronId
      let maxDrain = 0

      for (let i = 1; i < relevantPoints.length; i++) {
        const prevLevel = relevantPoints[i - 1].cauldron_levels[cauldronId] || 0
        const currLevel = relevantPoints[i].cauldron_levels[cauldronId] || 0
        const drain = prevLevel - currLevel
        if (drain > maxDrain) maxDrain = drain
      }

      const difference = ticket.volume - maxDrain
      const tolerance = 5

      if (Math.abs(difference) > tolerance) {
        found.push({
          id: `D${found.length + 1}`,
          ticketId: ticket.id,
          type: difference > 0 ? "Over-reported" : "Under-reported",
          actualVolume: Math.round(maxDrain * 100) / 100,
          difference: Math.round(difference * 100) / 100,
          description: `${ticket.courierName} reported ${ticket.volume}L but observed drain was ${Math.round(maxDrain * 100) / 100}L.`,
        })
      }
    })

    return found
  }, [tickets, timeSeriesData])

  // 📊 Stats summary
  const stats = useMemo(
    () => ({
      activeCauldrons: cauldrons.length,
      totalVolume: Math.round(cauldrons.reduce((sum, c) => sum + c.currentLevel, 0)),
      avgFillRate:
        cauldrons.length > 0
          ? (cauldrons.reduce((sum, c) => sum + c.fillRate, 0) / cauldrons.length).toFixed(1)
          : "0",
      totalTickets: tickets.length,
      suspiciousTickets: discrepancies.length,
    }),
    [cauldrons, tickets, discrepancies]
  )

  const market = useMemo(() => configData?.enchanted_market, [configData])
  const network = useMemo(() => configData?.network, [configData])
  const couriers = useMemo(() => configData?.couriers, [configData])

  return {
    cauldrons,
    tickets,
    discrepancies,
    stats,
    timeSeriesData,
    market,
    network,
    couriers,
    loading,
  }
}