import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
  try {
    const { cauldrons, recentData } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.3,
      },
    })

    const prompt = `Analyze these cauldron data and provide predictions:

Cauldrons:
${JSON.stringify(cauldrons, null, 2)}

Recent Data Points: ${recentData?.length || 0}

For each cauldron, provide:
1. A brief prediction about its future level (2-3 sentences)
2. Estimated time until empty (if draining) or full (if filling)
3. Confidence level (High/Medium/Low)

Format as JSON array with: cauldronId, cauldronName, prediction, timeToEmpty (minutes, optional), timeToFull (minutes, optional), confidence.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Try to extract JSON from response
    let predictions = []
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)?.[0]
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch)
      } else {
        // Fallback: create predictions from text
        cauldrons.forEach((c: any) => {
          const timeToEmpty = c.drainRate > 0 ? (c.currentLevel / c.drainRate) : null
          const timeToFull = c.fillRate > 0 ? ((c.maxVolume - c.currentLevel) / c.fillRate) : null
          predictions.push({
            cauldronId: c.id,
            cauldronName: c.name,
            prediction: `Current level: ${c.currentLevel.toFixed(1)}L (${((c.currentLevel / c.maxVolume) * 100).toFixed(1)}%). ${timeToEmpty ? `Will be empty in approximately ${Math.round(timeToEmpty)} minutes.` : timeToFull ? `Will be full in approximately ${Math.round(timeToFull)} minutes.` : 'Level is stable.'}`,
            timeToEmpty: timeToEmpty ? Math.round(timeToEmpty) : undefined,
            timeToFull: timeToFull ? Math.round(timeToFull) : undefined,
            confidence: "Medium",
          })
        })
      }
    } catch (e) {
      // Fallback predictions
      cauldrons.forEach((c: any) => {
        const timeToEmpty = c.drainRate > 0 ? (c.currentLevel / c.drainRate) : null
        predictions.push({
          cauldronId: c.id,
          cauldronName: c.name,
          prediction: `Based on current rates, ${c.name} will ${timeToEmpty ? `be empty in ~${Math.round(timeToEmpty)} minutes` : 'maintain current level'}.`,
          timeToEmpty: timeToEmpty ? Math.round(timeToEmpty) : undefined,
          confidence: "Medium",
        })
      })
    }

    return NextResponse.json({ predictions })
  } catch (error: any) {
    console.error("Error generating predictions:", error)
    return NextResponse.json(
      { error: error.message || "Failed to generate predictions" },
      { status: 500 }
    )
  }
}

