import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini - you'll need to set GEMINI_API_KEY in your environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Helper function to list available models
async function listAvailableModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    )
    if (response.ok) {
      const data = await response.json()
      return data.models?.map((m: any) => m.name) || []
    }
  } catch (e) {
    console.error("Error listing models:", e)
  }
  return []
}

export async function POST(request: Request) {
  try {
    const { message, history, dataContext } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set in environment variables" },
        { status: 500 }
      )
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Prioritize fastest models first for speed
    const modelNames = [
      "gemini-2.5-flash", // Fastest - try without prefix first
      "models/gemini-2.5-flash", // Fastest with prefix
      "models/gemini-2.5-flash-preview-05-20", // Flash preview
      "models/gemini-2.5-pro-preview-03-25", // Pro (slower but fallback)
      "gemini-pro", // Fallback
      "models/gemini-pro", // Fallback with prefix
    ]
    
    // Build conversation history first
    const chatHistory = (history || []).filter((msg: { role: string }) => {
      return msg.role === "user" || msg.role === "assistant"
    })

    // Ensure first message is from user
    if (chatHistory.length > 0 && chatHistory[0].role !== "user") {
      while (chatHistory.length > 0 && chatHistory[0].role !== "user") {
        chatHistory.shift()
      }
    }

    // Check if client wants streaming
    const url = new URL(request.url)
    const stream = url.searchParams.get("stream") === "true"

    // Try each model until one works
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            maxOutputTokens: 1024, // Limit response length for speed
            temperature: 0.7, // Balanced creativity/speed
          },
        })
        
        // Add system context - restrict to only potion factory dashboard questions
        const systemContext = `You are an AI assistant for a potion factory monitoring dashboard. Your ONLY purpose is to answer questions about:

1. The potion factory dashboard and its features
2. Cauldron data, levels, volumes, and status
3. Transport tickets and courier information
4. Discrepancies and suspicious activity
5. Historical data and trends
6. Network maps and routes
7. Dashboard functionality and how to use features

IMPORTANT RULES:
- ONLY answer questions related to the potion factory dashboard
- If asked about anything unrelated (general knowledge, other topics, etc.), politely decline and redirect to dashboard-related questions
- Example response for off-topic questions: "I'm here to help with questions about the potion factory dashboard. Could you ask me something about the cauldrons, transport tickets, discrepancies, or other dashboard features?"

${dataContext ? `Current Dashboard Data:
${dataContext.cauldrons ? `- Cauldrons: ${JSON.stringify(dataContext.cauldrons)}` : ''}
${dataContext.ticketsCount ? `- Total Transport Tickets: ${dataContext.ticketsCount}` : ''}
${dataContext.discrepanciesCount ? `- Discrepancies: ${dataContext.discrepanciesCount}` : ''}
${dataContext.stats ? `- Stats: ${JSON.stringify(dataContext.stats)}` : ''}` : ''}`

        const chat = model.startChat({
          history: chatHistory.length > 0
            ? [
                ...(systemContext ? [{
                  role: "user" as const,
                  parts: [{ text: systemContext }],
                }] : []),
                ...chatHistory.map((msg: { role: string; parts: string }) => ({
                  role: msg.role === "user" ? "user" : "model",
                  parts: [{ text: msg.parts }],
                })),
              ]
            : systemContext ? [{
                role: "user" as const,
                parts: [{ text: systemContext }],
              }] : [],
        })

        if (stream) {
          // Stream the response for fastest possible replies
          const result = await chat.sendMessageStream(message)
          
          // Create a readable stream
          const encoder = new TextEncoder()
          const stream = new ReadableStream({
            async start(controller) {
              try {
                let fullText = ""
                for await (const chunk of result.stream) {
                  const chunkText = chunk.text()
                  fullText += chunkText
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText, done: false })}\n\n`))
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: "", done: true, fullText })}\n\n`))
                controller.close()
              } catch (error: any) {
                controller.error(error)
              }
            },
          })

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
            },
          })
        } else {
          // Non-streaming (original behavior)
          const result = await chat.sendMessage(message)
          const response = await result.response
          const text = response.text()
          return NextResponse.json({ message: text })
        }
      } catch (error: any) {
        // If it's a 404 (model not found), try next model
        if (error.message?.includes("404") || error.message?.includes("not found")) {
          continue
        }
        // If it's a different error, throw it
        throw error
      }
    }

    // If all models failed, list available models and return helpful error
    const availableModels = await listAvailableModels()
    return NextResponse.json(
      {
        error: `No accessible models found. Tried: ${modelNames.join(", ")}. ${availableModels.length > 0 ? `Available models: ${availableModels.slice(0, 5).join(", ")}` : "Please check your API key and ensure it has access to Gemini models."}`,
      },
      { status: 500 }
    )
  } catch (error: any) {
    console.error("[v0] Error calling Gemini:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get response from Gemini" },
      { status: 500 }
    )
  }
}

