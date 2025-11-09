export interface Cauldron {
  id: string
  name: string
  latitude: number
  longitude: number
  maxVolume: number
  currentLevel: number
  fillRate: number // Liters per minute
  drainRate: number // Liters per minute
  totalDrain: number // Total drained volume in liters
}

export interface TransportTicket {
  id: string
  cauldronId: string
  cauldronName: string
  date: string
  volume: number
  courierId?: string
  courierName?: string
}

export interface DrainEvent {
  cauldronId: string
  timestamp: string
  volumeDrained: number
  duration: number // minutes
}

export interface Discrepancy {
  id: string
  ticketId: string
  type: "Over-reported" | "Under-reported" | "Unlogged"
  actualVolume: number
  difference: number
  description: string
}

export interface TimeSeriesPoint {
  timestamp: string
  cauldron_levels: Record<string, number> // ✅ matches your JSON
}

export interface Market {
  id: string
  name: string
  latitude: number
  longitude: number
  description: string
}

export interface Courier {
  courier_id: string
  name: string
  max_carrying_capacity: number
}

export interface NetworkEdge {
  from: string
  to: string
  travel_time_minutes: number
}

export interface Network {
  edges: NetworkEdge[]
  description: string
}