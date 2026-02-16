"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "../context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

const DURATIONS = [
  { hours: 24, label: "24h (Trial)" },
  { hours: 72, label: "3 Days (Intro)" },
  { hours: 168, label: "7 Days (Standard)" },
  { hours: 336, label: "14 Days (Committed)" },
  { hours: 720, label: "30 Days (Devoted)" },
]

export default function LockGoalStep() {
  const { data, updateData } = useOnboarding()
  const router = useRouter()

  const [hours, setHours] = useState(data.initial_lock_goal_hours || 24)
  const [intent, setIntent] = useState(data.lock_intent || "")

  const handleNext = () => {
    updateData({ initial_lock_goal_hours: hours, lock_intent: intent })
    router.push("/onboarding/notification-prefs")
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Initial Lock Protocol</h1>
        <p className="text-muted-foreground">Define the parameters of your first session.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label className="text-lg font-bold">Duration Target</Label>
          <div className="grid grid-cols-2 gap-3">
            {DURATIONS.map((d) => (
              <Button
                key={d.hours}
                variant={hours === d.hours ? "default" : "outline"}
                className={cn("h-12 font-bold", hours === d.hours && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
                onClick={() => setHours(d.hours)}
              >
                {d.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center space-x-4 pt-2">
             <Label className="w-24 font-mono text-xs uppercase text-muted-foreground">Custom (Hours)</Label>
             <Input
               type="number"
               value={hours}
               onChange={(e) => setHours(Number(e.target.value))}
               className="font-mono text-center text-lg font-bold"
             />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-lg font-bold">Session Intent</Label>
          <Textarea
            placeholder="e.g. To prove my devotion, to learn control..."
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="min-h-[100px]"
          />
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
