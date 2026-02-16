"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "../context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

const QUESTIONS = [
  { id: "fear", text: "What is your greatest fear?" },
  { id: "confidence", text: "When do you feel most/least confident?" },
  { id: "authority", text: "Describe your relationship with authority figures." },
  { id: "purpose", text: "Why are you here? What do you want to become?" }
]

export default function ProfileStep() {
  const { data, updateData } = useOnboarding()
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>(data.psych_profile)

  const handleNext = () => {
    updateData({ psych_profile: answers })
    router.push("/onboarding/lock-goal")
  }

  const handleChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Psych Profile</h1>
        <p className="text-muted-foreground">The AI needs to understand your mind to break it.</p>
      </div>

      <div className="space-y-6">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="space-y-2">
            <Label className="font-bold text-base">{q.text}</Label>
            <Textarea
              placeholder="Be honest. Lies will be punished."
              value={answers[q.id] || ""}
              onChange={(e) => handleChange(q.id, e.target.value)}
              className="min-h-[100px] resize-none bg-background/50 focus:bg-background transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Button onClick={handleNext} className="w-32 font-bold">
          Next Step
        </Button>
      </div>
    </div>
  )
}
