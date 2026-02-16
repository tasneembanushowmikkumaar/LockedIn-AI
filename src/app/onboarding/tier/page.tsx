"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding, Tier } from "../context"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Skull, Heart, Lock, ShieldAlert, Zap } from "lucide-react"

const TIERS = [
  {
    id: "Newbie",
    title: "Newbie",
    description: "Curious beginner. Mild discomfort, +30m to +2h penalties.",
    icon: Heart,
    color: "text-green-500",
  },
  {
    id: "Slave",
    title: "Slave",
    description: "Committed submissive. Moderate pain, +2h to +8h penalties.",
    icon: Lock,
    color: "text-blue-500",
  },
  {
    id: "Hardcore",
    title: "Hardcore",
    description: "Extreme masochist. Severe pain, +12h to +48h penalties.",
    icon: ShieldAlert,
    color: "text-orange-500",
  },
  {
    id: "Extreme",
    title: "Extreme",
    description: "Total devotion. Brutal torture, indefinite extensions.",
    icon: Zap,
    color: "text-red-500",
  },
  {
    id: "Destruction",
    title: "Destruction",
    description: "Annihilation of self. Merciless, days to weeks lock time.",
    icon: Skull,
    color: "text-destructive",
  },
] as const

export default function TierStep() {
  const { data, updateData } = useOnboarding()
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState<Tier | null>(data.tier)

  const handleNext = () => {
    if (selectedTier) {
      updateData({ tier: selectedTier })
      router.push("/onboarding/personality")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Select Difficulty Tier</h1>
        <p className="text-muted-foreground">Your tier determines punishment severity and language cruelty.</p>
      </div>

      <div className="grid gap-4">
        {TIERS.map((tier) => {
          const Icon = tier.icon
          const isSelected = selectedTier === tier.id

          return (
            <Card
              key={tier.id}
              className={cn(
                "cursor-pointer transition-all hover:scale-[1.02] border-2",
                isSelected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              )}
              onClick={() => setSelectedTier(tier.id as Tier)}
            >
              <div className="flex items-center p-4 gap-4">
                <div className={cn("p-3 rounded-full bg-background/50", tier.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-lg">{tier.title}</h3>
                  <p className="text-sm text-muted-foreground leading-tight">
                    {tier.description}
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
        <Button onClick={handleNext} disabled={!selectedTier} className="w-32 font-bold">
          Next Step
        </Button>
      </div>
    </div>
  )
}
