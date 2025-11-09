import { NextResponse } from "next/server"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY || "",
})

// Get available voices
export async function GET(request: Request) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY is not set in environment variables" },
        { status: 500 }
      )
    }

    const url = new URL(request.url)
    const action = url.searchParams.get("action")

    if (action === "voices") {
      const voices = await elevenlabs.voices.getAll()
      return NextResponse.json({ voices })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error calling ElevenLabs:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get voices from ElevenLabs" },
      { status: 500 }
    )
  }
}

// Convert text to speech
export async function POST(request: Request) {
  try {
    const { text, voiceId, modelId } = await request.json()

    if (!process.env.ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY is not set in environment variables" },
        { status: 500 }
      )
    }

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Use provided voiceId or default to a good voice
    const selectedVoiceId = voiceId || "21m00Tcm4TlvDq8ikWAM" // Rachel - a popular default voice

    // Use provided model or default
    const selectedModel = modelId || "eleven_multilingual_v2"

    // Convert text to speech
    const audio = await elevenlabs.textToSpeech.convert(selectedVoiceId, {
      text,
      modelId: selectedModel, // Fixed: use camelCase modelId instead of model_id
    })

    // Convert the audio stream to a buffer
    const chunks: Uint8Array[] = []
    // Handle the stream properly - it might be a ReadableStream
    if (audio instanceof ReadableStream) {
      const reader = audio.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          chunks.push(value)
        }
      }
    } else {
      // If it's already an async iterable
      for await (const chunk of audio as any) {
        chunks.push(chunk)
      }
    }
    const audioBuffer = Buffer.concat(chunks)

    // Return the audio as a response
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error("[v0] Error calling ElevenLabs:", error)
    return NextResponse.json(
      { error: error.message || "Failed to convert text to speech" },
      { status: 500 }
    )
  }
}

