"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "../context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function PhysicalDetailsStep() {
  const { data, updateData } = useOnboarding()
  const router = useRouter()

  const [bodyType, setBodyType] = useState(data.physical_details.body_type || "")
  const [device, setDevice] = useState(data.physical_details.chastity_device || "")
  const [flaccid, setFlaccid] = useState(data.physical_details.flaccid_length || "")
  const [erect, setErect] = useState(data.physical_details.erect_length || "")
  const [isGrower, setIsGrower] = useState(data.physical_details.is_grower ? "grower" : "shower")

  const handleNext = () => {
    updateData({
      physical_details: {
        body_type: bodyType,
        chastity_device: device,
        flaccid_length: flaccid,
        erect_length: erect,
        is_grower: isGrower === "grower"
      }
    })
    router.push("/onboarding/regimens")
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Physical Stats</h1>
        <p className="text-muted-foreground">The system requires your measurements for calibration.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="font-bold">General Build</Label>
          <Input
            placeholder="Height / Weight / Build (e.g. 5'10, 160lbs, Slim)"
            value={bodyType}
            onChange={(e) => setBodyType(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label className="font-bold">Chastity Device</Label>
          <Input
            placeholder="Device Model & Size (e.g. HolyTrainer V3, 45mm)"
            value={device}
            onChange={(e) => setDevice(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="font-bold">Flaccid (inches)</Label>
            <Input
              type="number"
              placeholder="3.5"
              step="0.1"
              value={flaccid}
              onChange={(e) => setFlaccid(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold">Erect (inches)</Label>
            <Input
              type="number"
              placeholder="6.0"
              step="0.1"
              value={erect}
              onChange={(e) => setErect(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="font-bold">Anatomy Type</Label>
          <RadioGroup defaultValue={isGrower} onValueChange={setIsGrower} className="flex gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="grower" id="grower" />
              <Label htmlFor="grower">Grower</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="shower" id="shower" />
              <Label htmlFor="shower">Shower</Label>
            </div>
          </RadioGroup>
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
