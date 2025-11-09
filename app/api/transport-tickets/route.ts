import { NextResponse } from "next/server"
import ticketsData from "@/data/transport-tickets.json"

export async function GET() {
  return NextResponse.json(ticketsData)
}
