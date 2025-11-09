import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.7,
      },
    })

    let prompt = ""

    if (type === "discrepancy") {
      prompt = `Analyze this transport ticket discrepancy and explain what might have caused it:

Ticket ID: ${data.ticketId}
Cauldron: ${data.cauldronName}
Reported Volume: ${data.ticketVolume}L
Actual Drain: ${data.actualVolume}L
Difference: ${data.difference}L
Type: ${data.type}
Date: ${data.date}

Provide a brief explanation (2-3 sentences) of what might have caused this discrepancy.`
    } else if (type === "pattern") {
      prompt = `Analyze these patterns in the potion factory data and provide insights:

${JSON.stringify(data, null, 2)}

Provide 2-3 key insights about patterns or trends you notice.`
    } else if (type === "recommendation") {
      prompt = `Based on this potion factory data, provide actionable recommendations:

${JSON.stringify(data, null, 2)}

Provide 2-3 specific, actionable recommendations.`
    }

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ insight: text })
  } catch (error: any) {
    console.error("Error generating insight:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate insight" },
      { status: 500 }
    )
  }
}

