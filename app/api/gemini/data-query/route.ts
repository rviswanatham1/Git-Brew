import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
  try {
    const { query, data } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set" },
        { status: 500 }
      )
    }

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Prepare data summary for Gemini
    const dataSummary = {
      cauldrons: data.cauldrons?.map((c: any) => ({
        id: c.id,
        name: c.name,
        currentLevel: c.currentLevel,
        maxVolume: c.maxVolume,
        fillRate: c.fillRate,
        totalDrain: c.totalDrain,
      })),
      tickets: {
        total: data.tickets?.length || 0,
        recent: data.tickets?.slice(0, 10).map((t: any) => ({
          id: t.id,
          cauldron: t.cauldronName,
          volume: t.volume,
          date: t.date,
          courier: t.courierName,
        })),
      },
      discrepancies: {
        total: data.discrepancies?.length || 0,
        types: data.discrepancies?.reduce((acc: any, d: any) => {
          acc[d.type] = (acc[d.type] || 0) + 1
          return acc
        }, {}),
      },
      stats: data.stats,
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.3, // Lower for more factual responses
      },
    })

    const prompt = `You are an AI assistant helping analyze a potion factory dashboard. Answer questions about the data provided.

Data Summary:
${JSON.stringify(dataSummary, null, 2)}

User Query: ${query}

Provide a clear, concise answer based on the data. If the data doesn't contain the information needed, say so.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ answer: text })
  } catch (error: any) {
    console.error("Error in data query:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process query" },
      { status: 500 }
    )
  }
}

