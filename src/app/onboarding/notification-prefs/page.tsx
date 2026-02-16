"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "../context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Bell, BellOff } from "lucide-react"

export default function NotificationPrefsStep() {
  const { data, updateData } = useOnboarding()
  const router = useRouter()

  const [frequency, setFrequency] = useState(data.notification_frequency || 5)
  const [start, setStart] = useState(data.quiet_hours_start || "22:00")
  const [end, setEnd] = useState(data.quiet_hours_end || "07:00")

  const handleNext = () => {
    updateData({
      notification_frequency: frequency,
      quiet_hours_start: start,
      quiet_hours_end: end
    })
    router.push("/onboarding/review")
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">System Access</h1>
        <p className="text-muted-foreground">Configure how often the AI intervenes.</p>
      </div>

      <div className="space-y-8 bg-card/30 p-6 rounded-xl border border-border">

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 font-bold text-lg">
              <Bell className="w-5 h-5 text-primary" />
              Intervention Frequency
            </Label>
            <span className="font-mono text-xl font-bold text-primary">{frequency}/day</span>
          </div>
          <Slider
            min={1}
            max={30}
            step={1}
            value={[frequency]}
            onValueChange={(val) => setFrequency(val[0])}
            className="py-4"
          />
          <p className="text-xs text-muted-foreground text-center">
            Higher frequency increases difficulty and immersion.
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <BellOff className="w-5 h-5 text-muted-foreground" />
            <Label className="font-bold text-lg">Quiet Protocol</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Define sleep hours where notifications are suppressed (except emergencies).
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start (Sleep)</Label>
              <Input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="font-mono text-center"
              />
            </div>
            <div className="space-y-2">
              <Label>End (Wake)</Label>
              <Input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="font-mono text-center"
              />
            </div>
          </div>
        </div>

      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
        <Button onClick={handleNext} className="w-32 font-bold">
          Review
        </Button>
      </div>
    </div>
  )
}
