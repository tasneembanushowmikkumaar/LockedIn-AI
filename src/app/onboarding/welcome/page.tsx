"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "../context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function WelcomeStep() {
  const { data, updateData } = useOnboarding()
  const router = useRouter()
  const [consent, setConsent] = useState(data.age_consent)

  const handleNext = () => {
    if (consent) {
      updateData({ age_consent: true })
      router.push("/onboarding/tier")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Protocol Initiation</h1>
        <p className="text-muted-foreground">Review the terms of engagement before proceeding.</p>
      </div>

      <Card className="border-destructive/50 bg-destructive/5 neumorphic-inset">
        <CardHeader className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            WARNING: ADULT CONTENT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            LockedIn is a high-intensity psychological conditioning tool designed for consenting adults only.
            It simulates loss of control, humiliation, and enforced chastity.
          </p>
          <p>
            By proceeding, you acknowledge that you are at least 18 years of age (or legal age of majority)
            and voluntarily consent to view and participate in adult-oriented kink activities.
          </p>
          <p className="font-bold text-destructive">
            This application uses AI to generate dominant and potentially degradation-focused content.
            You can set hard limits at any time, but the core experience is designed to be intense.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-start space-x-3 p-4 border rounded-lg bg-card/50">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(c) => setConsent(c as boolean)}
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="consent" className="font-bold">
            I confirm I am 18+ and consent to be controlled.
          </Label>
          <p className="text-xs text-muted-foreground">
            I understand that my choices will shape my training.
          </p>
        </div>
      </div>

      <Button
        className="w-full h-12 text-lg font-bold"
        onClick={handleNext}
        disabled={!consent}
      >
        INITIATE
      </Button>
    </div>
  )
}
