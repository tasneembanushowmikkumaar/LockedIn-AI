"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "../context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

const KINKS = [
  "Chastity", "Denial", "Edging", "SPH",
  "CEI", "Sissy", "Humiliation", "Anal",
  "CBT", "Feet", "Worship", "Hypno",
  "Bi/Gay", "Exhibitionism", "Task-Based"
]

export default function LimitsStep() {
  const { data, updateData } = useOnboarding()
  const router = useRouter()

  const [hardLimits, setHardLimits] = useState(data.hard_limits.join(", "))
  const [softLimits, setSoftLimits] = useState(data.soft_limits.join(", "))
  const [selectedKinks, setSelectedKinks] = useState<string[]>(data.interests)

  const toggleKink = (kink: string) => {
    setSelectedKinks(prev =>
      prev.includes(kink) ? prev.filter(k => k !== kink) : [...prev, kink]
    )
  }

  const handleNext = () => {
    updateData({
      hard_limits: hardLimits.split(",").map(s => s.trim()).filter(Boolean),
      soft_limits: softLimits.split(",").map(s => s.trim()).filter(Boolean),
      interests: selectedKinks
    })
    router.push("/onboarding/physical-details")
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Limits & Desires</h1>
        <p className="text-muted-foreground">Define your boundaries and your cravings.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-destructive font-bold">Hard Limits (Absolute No-Go)</Label>
          <Textarea
            placeholder="e.g. Scat, Gore, Blackmail (comma separated)"
            value={hardLimits}
            onChange={(e) => setHardLimits(e.target.value)}
            className="border-destructive/30 focus:border-destructive"
          />
          <p className="text-xs text-muted-foreground">The AI will never violate these.</p>
        </div>

        <div className="space-y-2">
          <Label>Soft Limits (Hesitant / Need Warm-up)</Label>
          <Textarea
            placeholder="e.g. Public humiliation, intense pain"
            value={softLimits}
            onChange={(e) => setSoftLimits(e.target.value)}
          />
        </div>

        <div className="space-y-3 pt-4">
          <Label className="text-lg font-bold">Core Kinks</Label>
          <div className="grid grid-cols-2 gap-3">
            {KINKS.map((kink) => (
              <div key={kink} className="flex items-center space-x-2 bg-card/50 p-3 rounded-md border border-border">
                <Checkbox
                  id={kink}
                  checked={selectedKinks.includes(kink)}
                  onCheckedChange={() => toggleKink(kink)}
                />
                <Label htmlFor={kink} className="cursor-pointer flex-1">{kink}</Label>
              </div>
            ))}
          </div>
        </div>
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
