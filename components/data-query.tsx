"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, Sparkles } from "lucide-react"
import type { Cauldron, TransportTicket, Discrepancy } from "@/types/cauldron"

interface DataQueryProps {
  cauldrons: Cauldron[]
  tickets: TransportTicket[]
  discrepancies: Discrepancy[]
  stats: any
}

export function DataQuery({ cauldrons, tickets, discrepancies, stats }: DataQueryProps) {
  const [query, setQuery] = useState("")
  const [answer, setAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleQuery = async () => {
    if (!query.trim() || isLoading) return

    setIsLoading(true)
    setAnswer("")

    try {
      const response = await fetch("/api/gemini/data-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          data: { cauldrons, tickets, discrepancies, stats },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get answer")
      }

      const data = await response.json()
      setAnswer(data.answer || "No answer provided")
    } catch (error: any) {
      setAnswer(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const exampleQueries = [
    "Which cauldron has the lowest volume?",
    "What's the average volume across all cauldrons?",
    "Show me all discrepancies from this week",
    "Which courier has the most tickets?",
    "What's the total volume transported today?",
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Ask About Your Data</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Ask questions about your potion factory data in natural language
      </p>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            placeholder="e.g., Which cauldron needs attention?"
            disabled={isLoading}
          />
          <Button onClick={handleQuery} disabled={!query.trim() || isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {answer && (
          <Card className="p-4 bg-muted">
            <p className="text-sm text-foreground whitespace-pre-wrap">{answer}</p>
          </Card>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-2">Example queries:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery(example)
                  handleQuery()
                }}
                disabled={isLoading}
                className="text-xs"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

