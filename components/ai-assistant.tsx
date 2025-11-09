"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, MicOff, Volume2, VolumeX, Send, Loader2, Bot, User, MessageSquare, X, Minimize2, Maximize2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { Cauldron, TransportTicket, Discrepancy } from "@/types/cauldron"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIAssistantProps {
  cauldrons?: Cauldron[]
  tickets?: TransportTicket[]
  discrepancies?: Discrepancy[]
  stats?: any
}

export function AIAssistant({ cauldrons, tickets, discrepancies, stats }: AIAssistantProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant. You can chat with me using text or voice. How can I help you today?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true)
  const [availableVoices, setAvailableVoices] = useState<any[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("21m00Tcm4TlvDq8ikWAM") // Default: Rachel
  const [useElevenLabs, setUseElevenLabs] = useState(true) // Use ElevenLabs by default
  const [interimTranscript, setInterimTranscript] = useState("") // For showing real-time speech

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const voiceInitializedRef = useRef(false)
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const spokenTextRef = useRef<string>("") // Track what text we've already started speaking

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
    }
  }, [])

  // Load ElevenLabs voices
  useEffect(() => {
    const loadElevenLabsVoices = async () => {
      try {
        const response = await fetch("/api/elevenlabs?action=voices")
        if (response.ok) {
          const data = await response.json()
          setAvailableVoices(data.voices || [])
          // Set default voice if not already set
          if (data.voices && data.voices.length > 0 && selectedVoiceId === "21m00Tcm4TlvDq8ikWAM") {
            const defaultVoice = data.voices.find((v: any) => v.name === "Rachel") || data.voices[0]
            if (defaultVoice) {
              setSelectedVoiceId(defaultVoice.voice_id)
            }
          }
        }
      } catch (error) {
        console.error("Error loading ElevenLabs voices:", error)
        // Fallback to browser voices if ElevenLabs fails
        setUseElevenLabs(false)
      }
    }

    if (useElevenLabs) {
      loadElevenLabsVoices()
    }
  }, [useElevenLabs])

  // Initialize speech recognition and browser voices (fallback)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition() as any
        recognition.continuous = true // Keep listening
        recognition.interimResults = true // Show interim results
        recognition.lang = "en-US"

        const finalTranscriptRef = { current: "" }

        recognition.onresult = (event: any) => {
          let interim = ""
          let final = ""

          // Process all results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              final += transcript + " "
            } else {
              interim += transcript
            }
          }

          finalTranscriptRef.current += final
          const fullFinal = finalTranscriptRef.current.trim()
          setInterimTranscript(interim)

          // Show both final and interim text in input
          const displayText = fullFinal + (interim ? " " + interim : "")
          setInput(displayText)

          // Clear any existing timeout
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current)
          }

          // If we have interim results or final text, set a timeout to detect silence
          if (interim || fullFinal) {
            silenceTimeoutRef.current = setTimeout(() => {
              // User stopped talking - send the message
              const textToSend = fullFinal || interim.trim()
              if (textToSend && !isLoading) {
                setInterimTranscript("")
                setInput("")
                finalTranscriptRef.current = ""
                sendMessage(textToSend)
                recognition.stop()
              }
            }, 1500) // 1.5 seconds of silence = user stopped talking
          }
        }

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error)
          if (event.error !== "no-speech") {
            setIsListening(false)
            setInterimTranscript("")
            finalTranscriptRef.current = ""
            if (silenceTimeoutRef.current) {
              clearTimeout(silenceTimeoutRef.current)
            }
          }
        }

        recognition.onend = () => {
          // If we have text and recognition ended naturally, send it
          const textToSend = finalTranscriptRef.current || input.trim()
          if (textToSend && isListening && !isLoading) {
            setInterimTranscript("")
            setInput("")
            finalTranscriptRef.current = ""
            sendMessage(textToSend)
          }
          setIsListening(false)
          setInterimTranscript("")
          finalTranscriptRef.current = ""
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current)
          }
        }

        recognitionRef.current = recognition
      }

      synthesisRef.current = window.speechSynthesis

      // Load browser voices as fallback
      if (!useElevenLabs) {
        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices()
          setAvailableVoices(voices.map((v) => ({ name: v.name, voice_id: v.name })))
        }
        loadVoices()
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }
  }, [useElevenLabs])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Create placeholder for streaming response
    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      // Build conversation history for context
      // Exclude the initial greeting and ensure first message is from user
      // Filter to only include actual conversation pairs (user + assistant)
      const conversationMessages = messages.slice(1) // Skip initial greeting
      const history = conversationMessages.map((msg) => ({
        role: msg.role,
        parts: msg.content,
      }))

      // Add data context if available
      const dataContext = (cauldrons || tickets || discrepancies) ? {
        cauldrons: cauldrons?.slice(0, 5).map(c => ({
          name: c.name,
          level: c.currentLevel,
          maxVolume: c.maxVolume,
        })),
        ticketsCount: tickets?.length || 0,
        discrepanciesCount: discrepancies?.length || 0,
        stats: stats ? {
          totalVolume: stats.totalVolume,
          activeCauldrons: stats.activeCauldrons,
        } : undefined,
      } : undefined

      // Use streaming for fastest responses
      const response = await fetch("/api/gemini?stream=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text.trim(),
          history,
          dataContext, // Include data context for data-aware responses
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""
      let speechTriggered = false
      let speechBuffer = ""
      const SPEECH_TRIGGER_LENGTH = 50 // Start speaking after 50 characters

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.text) {
                  fullText += data.text
                  speechBuffer += data.text
                  
                  // Update the message in real-time
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    const lastMessage = newMessages[newMessages.length - 1]
                    if (lastMessage.role === "assistant" && lastMessage.content === "" || lastMessage.content.length < fullText.length) {
                      lastMessage.content = fullText
                    }
                    return newMessages
                  })

                  // Start speaking as soon as we have enough text (don't wait for full response)
                  if (isSpeechEnabled && speechBuffer.length >= SPEECH_TRIGGER_LENGTH) {
                    if (!speechTriggered) {
                      speechTriggered = true
                      // Start speaking with what we have so far
                      speakText(fullText, false).catch(() => {
                        // If it fails, we'll retry with full text later
                        speechTriggered = false
                      })
                    } else {
                      // Update speech with new text (will seamlessly restart if significant new content)
                      speakText(fullText, true).catch(() => {
                        // Ignore errors on updates
                      })
                    }
                  }
                }
                if (data.done) {
                  fullText = data.fullText || fullText
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      } else {
        // Fallback to non-streaming if streaming not available
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        fullText = data.message
        setMessages((prev) => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage.role === "assistant") {
            lastMessage.content = fullText
          }
          return newMessages
        })
      }

      // Final update with complete text
      setMessages((prev) => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage.role === "assistant") {
          lastMessage.content = fullText
        }
        return newMessages
      })

      // If speech wasn't triggered yet (very short response), trigger it now
      if (isSpeechEnabled && fullText && !speechTriggered) {
        speakText(fullText)
      }
    } catch (error: any) {
      console.error("Error sending message:", error)
      // Remove the placeholder message and add error
      setMessages((prev) => {
        const newMessages = prev.slice(0, -1) // Remove placeholder
        newMessages.push({
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message || "Unknown error"}. Please check your API key in .env file.`,
          timestamp: new Date(),
        })
        return newMessages
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Stop listening if active
    if (isListening) {
      stopListening()
    }
    if (input.trim()) {
      sendMessage(input)
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isLoading) {
      setIsListening(true)
      setInterimTranscript("")
      setInput("")
      try {
        recognitionRef.current.start()
      } catch (e) {
        // Already started, ignore
        console.log("Recognition already started")
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setInterimTranscript("")
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current)
      }
    }
  }

  const speakText = async (text: string, isUpdate = false) => {
    // If already speaking and this is an update, check if there's new text to queue
    if (isSpeaking && isUpdate) {
      // Check if there's additional text that hasn't been spoken yet
      const newText = text.substring(spokenTextRef.current.length)
      if (newText.trim().length > 20) { // Only queue if significant new text (20+ chars)
        // Cancel current and restart with full text for seamless experience
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current = null
        }
        if (synthesisRef.current) {
          synthesisRef.current.cancel()
        }
        setIsSpeaking(false)
        // Continue to speak the full text
      } else {
        // Not enough new text, just return
        return
      }
    } else if (isSpeaking && !isUpdate) {
      // Don't interrupt if not an update
      return
    }

    // Track what we're about to speak
    spokenTextRef.current = text

    // Stop any ongoing speech
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }

    if (useElevenLabs) {
      // Use ElevenLabs for text-to-speech
      try {
        setIsSpeaking(true)
        const response = await fetch("/api/elevenlabs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            voiceId: selectedVoiceId,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate speech")
        }

        // Get audio blob
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        // Create audio element and play
        const audio = new Audio(audioUrl)
        audioRef.current = audio

        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
          audioRef.current = null
        }

        audio.onerror = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(audioUrl)
          audioRef.current = null
        }

        await audio.play()
      } catch (error) {
        console.error("Error with ElevenLabs:", error)
        setIsSpeaking(false)
        // Fallback to browser TTS
        if (synthesisRef.current) {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)
        synthesisRef.current.speak(utterance)
        }
      }
    } else {
      // Use browser TTS as fallback
      if (synthesisRef.current) {
        const utterance = new SpeechSynthesisUtterance(text)
        if (selectedVoiceId) {
          const voice = availableVoices.find((v) => v.voice_id === selectedVoiceId)
          if (voice && voice.name) {
            const browserVoice = window.speechSynthesis
              .getVoices()
              .find((v) => v.name === voice.name)
            if (browserVoice) {
              utterance.voice = browserVoice
            }
          }
        }
        utterance.rate = 0.95
        utterance.pitch = 1.0
        utterance.volume = 1.0
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)
        synthesisRef.current.speak(utterance)
      }
    }
  }

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
    }
    setIsSpeaking(false)
  }

  const toggleSpeech = () => {
    if (isSpeaking) {
      stopSpeaking()
    }
    setIsSpeechEnabled(!isSpeechEnabled)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 p-0"
        size="icon"
        title="Open AI Assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 w-96 z-50 flex flex-col shadow-2xl rounded-lg border border-border bg-background transition-all duration-300 ${isMinimized ? 'h-auto' : 'h-[600px]'}`}>
      <Card className={`flex flex-col ${isMinimized ? 'h-auto' : 'h-full flex-1 overflow-hidden'}`}>
        {/* Header */}
        <div className="border-b border-border p-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">AI Assistant</h2>
            {!isMinimized && (
              <p className="text-xs text-muted-foreground">Powered by Gemini</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                setIsMinimized(!isMinimized)
              }}
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {!isMinimized && (
          <>
        <div className="border-b border-border px-3 py-2 flex items-center gap-2 bg-muted/50 flex-shrink-0">
            {isSpeechEnabled && availableVoices.length > 0 && (
              <Select
                value={selectedVoiceId}
                onValueChange={setSelectedVoiceId}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Voice" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice: any) => (
                    <SelectItem key={voice.voice_id || voice.name} value={voice.voice_id || voice.name}>
                      {voice.name || voice.voice_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleSpeech}
              title={isSpeechEnabled ? "Disable speech" : "Enable speech"}
            >
              {isSpeechEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            {isSpeaking && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stopSpeaking} title="Stop speaking">
                <VolumeX className="h-4 w-4" />
              </Button>
            )}
          </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={isListening ? (input || interimTranscript) : input}
                onChange={(e) => {
                  if (!isListening) {
                    setInput(e.target.value)
                  }
                }}
                placeholder={isListening ? "Listening... (will auto-send when you stop talking)" : "Type your message or use voice..."}
                disabled={isLoading}
                className="pr-10"
              />
              {isListening && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  {interimTranscript && (
                    <span className="text-xs text-muted-foreground italic">Speaking...</span>
                  )}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={isListening ? stopListening : startListening}
              disabled={isLoading}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 text-red-500" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Button type="submit" disabled={!input.trim() || isLoading || isListening}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-1">
            {isListening
              ? "Listening... (auto-sends after 1.5s silence)"
              : "Click mic for voice input"}
          </p>
        </div>
        </>
        )}
      </Card>
    </div>
  )
}


