import { NextResponse } from "next/server"
import timestampsData from "@/data/timestamps.json" assert { type: "json" }

const timestamps = timestampsData as Array<{
  timestamp: string
  cauldron_levels: Record<string, number>
}>

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const minute = Number(url.searchParams.get("minute")) || 0

    // Return only one timestamp if requested
    if (minute >= 0 && minute < timestamps.length) {
      return NextResponse.json(timestamps[minute])
    }

    // Otherwise return full dataset
    return NextResponse.json(timestamps)
  } catch (error) {
    console.error("[v0] Error loading cauldron levels:", error)
    return NextResponse.json(
      { error: "Failed to load cauldron levels data" },
      { status: 500 }
    )
  }
}