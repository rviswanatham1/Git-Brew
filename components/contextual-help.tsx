"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HelpCircle, X, Loader2 } from "lucide-react"

interface ContextualHelpProps {
  context?: string
  componentName?: string
}

export function ContextualHelp({ context, componentName }: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleQuestion = async () => {
    if (!question.trim() || isLoading) return

    setIsLoading(true)
    setAnswer("")

    try {
      const response = await fetch("/api/gemini/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          context: context || componentName || "general dashboard",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get help")
      }

      const data = await response.json()
      setAnswer(data.answer)
    } catch (error: any) {
      setAnswer(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
        title="Get Help"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-xl">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          Contextual Help
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-4 space-y-3">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleQuestion()}
          placeholder="Ask a question about this feature..."
          disabled={isLoading}
        />
        <Button onClick={handleQuestion} disabled={!question.trim() || isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Getting help...
            </>
          ) : (
            "Get Help"
          )}
        </Button>
        {answer && (
          <div className="p-3 bg-muted rounded-lg text-sm text-foreground whitespace-pre-wrap">
            {answer}
          </div>
        )}
      </div>
    </Card>
  )
}

