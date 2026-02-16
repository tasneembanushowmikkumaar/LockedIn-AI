"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "../context"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { BrainCircuit, Star, Zap, Crown, Heart, Lock, User, Gem, Smile } from "lucide-react"

const PERSONAS = [
  { id: "Cruel Mistress", title: "Cruel Mistress", description: "Harsh, mocking, enjoys suffering.", icon: BrainCircuit },
  { id: "Strict Master", title: "Strict Master", description: "Authoritative, paternal dominance.", icon: Lock },
  { id: "Clinical Sadist", title: "Clinical Sadist", description: "Detached, experimental.", icon: User },
  { id: "Playful Tease", title: "Playful Tease", description: "Flirty but merciless.", icon: Smile },
  { id: "Humiliation Expert", title: "Humiliation Expert", description: "Constant SPH & degradation.", icon: Star },
  { id: "Goddess/Deity", title: "Goddess", description: "Worship-focused, religious framing.", icon: Gem },
  { id: "Dommy Mommy", title: "Dommy Mommy", description: "Warm but cruel, maternal.", icon: Heart },
  { id: "Bratty Keyholder", title: "Bratty Keyholder", description: "Teasing, childish cruelty.", icon: Zap },
  { id: "Psychological Manipulator", title: "Psychological Manipulator", description: "Gaslighting & mind games.", icon: Crown },
]

export default function PersonalityStep() {
  const { data, updateData } = useOnboarding()
  const router = useRouter()
  const [selectedPersona, setSelectedPersona] = useState<string | null>(data.ai_personality)

  const handleNext = () => {
    if (selectedPersona) {
      updateData({ ai_personality: selectedPersona })
      router.push("/onboarding/limits")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Choose Your Master</h1>
        <p className="text-muted-foreground">Select the AI persona that will control you.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {PERSONAS.map((persona) => {
          const Icon = persona.icon
          const isSelected = selectedPersona === persona.id

          return (
            <Card
              key={persona.id}
              className={cn(
                "cursor-pointer transition-all hover:scale-[1.01] border",
                isSelected ? "border-primary bg-primary/10 shadow-lg ring-1 ring-primary" : "border-border hover:border-primary/50"
              )}
              onClick={() => setSelectedPersona(persona.id)}
            >
              <div className="flex items-center p-3 gap-3">
                <div className={cn("p-2 rounded-lg bg-background/50 text-muted-foreground", isSelected && "text-primary")}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{persona.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {persona.description}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Button onClick={handleNext} disabled={!selectedPersona} className="w-32 font-bold">
          Next Step
        </Button>
      </div>
    </div>
  )
}
