import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
    }

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: "Text and target language required" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.3,
      },
    })

    const prompt = `Translate the following text to ${targetLanguage}. Only return the translation, nothing else:

${text}`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const translated = response.text()

    return NextResponse.json({ translated })
  } catch (error: any) {
    console.error("Error translating:", error)
    return NextResponse.json(
      { error: error.message || "Failed to translate" },
      { status: 500 }
    )
  }
}

