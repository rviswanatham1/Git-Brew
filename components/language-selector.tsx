"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from "lucide-react"

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
]

export function LanguageSelector() {
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [isTranslating, setIsTranslating] = useState(false)

  const translatePage = async (targetLang: string) => {
    if (targetLang === "en" || isTranslating) return

    setIsTranslating(true)
    try {
      // Get all text elements
      const textElements = document.querySelectorAll("h1, h2, h3, p, span, div, button")
      const textsToTranslate: Array<{ element: Element; originalText: string }> = []

      textElements.forEach((el) => {
        const text = el.textContent?.trim()
        if (text && text.length > 0 && text.length < 100) {
          textsToTranslate.push({ element: el, originalText: text })
        }
      })

      // Translate in batches
      for (const item of textsToTranslate.slice(0, 20)) {
        try {
          const response = await fetch("/api/gemini/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: item.originalText,
              targetLanguage: languages.find(l => l.code === targetLang)?.name || targetLang,
            }),
          })
          const data = await response.json()
          if (data.translated && item.element.textContent) {
            item.element.textContent = data.translated
          }
        } catch (error) {
          console.error("Translation error:", error)
        }
      }
    } catch (error) {
      console.error("Translation error:", error)
    } finally {
      setIsTranslating(false)
    }
  }

  return (
    <Select
      value={selectedLanguage}
      onValueChange={(value) => {
        setSelectedLanguage(value)
        translatePage(value)
      }}
    >
      <SelectTrigger className="w-[140px]">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

