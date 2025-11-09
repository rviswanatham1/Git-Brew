import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
  try {
    const { question, context } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.3,
      },
    })

    const prompt = `You are a helpful assistant for a potion factory dashboard. Answer this question about ${context}:

Question: ${question}

Provide a clear, concise, helpful answer. If it's about troubleshooting, provide step-by-step guidance.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ answer: text })
  } catch (error: any) {
    console.error("Error in help:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get help" },
      { status: 500 }
    )
  }
}

