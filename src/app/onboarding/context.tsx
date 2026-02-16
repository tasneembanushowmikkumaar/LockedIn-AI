"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export type Tier = "Newbie" | "Slave" | "Hardcore" | "Extreme" | "Destruction"

export interface OnboardingData {
  // Step 1: Welcome
  age_consent: boolean

  // Step 2: Tier
  tier: Tier | null

  // Step 3: Personality
  ai_personality: string | null

  // Step 4: Limits
  hard_limits: string[]
  soft_limits: string[]
  interests: string[] // Core kinks

  // Step 5: Physical
  physical_details: {
    flaccid_length?: string
    erect_length?: string
    is_grower?: boolean
    chastity_device?: string
    body_type?: string
  }

  // Step 6: Regimens
  regimens: string[]

  // Step 7: Profile (Psychological)
  psych_profile: {
    [key: string]: string
  }

  // Step 8: Lock Goal
  initial_lock_goal_hours: number
  lock_intent: string

  // Step 9: Notifications
  notification_frequency: number // messages per day approx
  quiet_hours_start: string
  quiet_hours_end: string
}

const DEFAULT_DATA: OnboardingData = {
  age_consent: false,
  tier: null,
  ai_personality: null,
  hard_limits: [],
  soft_limits: [],
  interests: [],
  physical_details: {},
  regimens: [],
  psych_profile: {},
  initial_lock_goal_hours: 24,
  lock_intent: "",
  notification_frequency: 5,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
}

interface OnboardingContextType {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  resetData: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("lockedin_onboarding")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setData((prev) => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error("Failed to parse onboarding data", e)
      }
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("lockedin_onboarding", JSON.stringify(data))
  }, [data])

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const resetData = () => {
    setData(DEFAULT_DATA)
    localStorage.removeItem("lockedin_onboarding")
  }

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within a OnboardingProvider")
  }
  return context
}
