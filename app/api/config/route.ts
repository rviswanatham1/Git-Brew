import { NextResponse } from "next/server"
import configData from "@/data/config.json"

export async function GET() {
  return NextResponse.json(configData)
}
