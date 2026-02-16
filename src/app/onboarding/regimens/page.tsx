"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "../context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const REGIMENS = [
  "Sissy Training",
  "Obedience & Service",
  "Bisexual/Fluidity",
  "SPH Conditioning",
  "CEI Mastery",
  "Pain Tolerance",
  "Anal Mastery",
  "Edging Endurance",
  "Worship & Devotion",
  "Mind-Break Protocol",
  "Gay Transformation",
  "Total Power Exchange",
  "Humiliation Marathon",
  "Gooning",
  "Findom"
]

export default function RegimensStep() {
  const { data, updateData } = useOnboarding()
  const router = useRouter()
  const [selectedRegimens, setSelectedRegimens] = useState<string[]>(data.regimens)

  const toggleRegimen = (regimen: string) => {
    setSelectedRegimens(prev =>
      prev.includes(regimen) ? prev.filter(r => r !== regimen) : [...prev, regimen]
    )
  }

  const handleNext = () => {
    updateData({ regimens: selectedRegimens })
    router.push("/onboarding/profile")
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Training Tracks</h1>
        <p className="text-muted-foreground">Select long-term behavioral modification programs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {REGIMENS.map((regimen) => {
          const isSelected = selectedRegimens.includes(regimen)

          return (
            <Card
              key={regimen}
              className={cn(
                "cursor-pointer transition-all hover:bg-accent/5",
                isSelected ? "border-primary bg-primary/10" : "border-border"
              )}
              onClick={() => toggleRegimen(regimen)}
            >
              <div className="flex items-center p-4 gap-3">
                <Checkbox
                  id={regimen}
                  checked={isSelected}
                  onCheckedChange={() => toggleRegimen(regimen)}
                  className="pointer-events-none" // Handled by card click
                />
                <Label htmlFor={regimen} className="font-bold cursor-pointer pointer-events-none">
                  {regimen}
                </Label>
              </div>
            </Card>
          )
        })}
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
