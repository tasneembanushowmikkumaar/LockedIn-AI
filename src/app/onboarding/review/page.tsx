"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useOnboarding } from "../context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Lock, Unlock } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ReviewStep() {
  const { data } = useOnboarding()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [isLocked, setIsLocked] = useState(false)

  const handleLockIn = async () => {
    setLoading(true)

    // 1. Get User
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      toast({ title: "Error", description: "User not found. Please login again.", variant: "destructive" })
      setLoading(false)
      return
    }

    // 2. Upsert Profile (to ensure it exists)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        tier: data.tier,
        ai_personality: data.ai_personality,
        hard_limits: data.hard_limits,
        soft_limits: data.soft_limits,
        interests: data.interests,
        initial_lock_goal_hours: data.initial_lock_goal_hours,
        // Storing complex objects as JSONB (assuming schema supports it or we rely on loose schema)
        physical_details: data.physical_details,
        regimens: data.regimens,
        psych_profile: data.psych_profile,
        notification_prefs: {
          frequency: data.notification_frequency,
          quiet_hours_start: data.quiet_hours_start,
          quiet_hours_end: data.quiet_hours_end
        },
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error("Profile update failed:", profileError)
      toast({ title: "Initialization Failed", description: "Could not save profile.", variant: "destructive" })
      setLoading(false)
      return
    }

    // 3. Create Active Session
    const scheduledEnd = new Date()
    scheduledEnd.setHours(scheduledEnd.getHours() + data.initial_lock_goal_hours)

    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        status: 'active',
        start_time: new Date().toISOString(),
        scheduled_end_time: scheduledEnd.toISOString(),
        tier: data.tier,
        ai_personality: data.ai_personality
      })

    if (sessionError) {
      console.error("Session creation failed:", sessionError)
       // Continue anyway since profile is set? Or fail?
       // Better to warn.
       toast({ title: "Session Start Failed", description: "Profile saved but session failed.", variant: "destructive" })
    }

    // Animation & Redirect
    setIsLocked(true)
    setTimeout(() => {
       router.push("/home")
    }, 2000)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Final Verification</h1>
        <p className="text-muted-foreground">Review your protocol before committing.</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Protocol Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Tier:</span>
              <span className="font-bold">{data.tier}</span>

              <span className="text-muted-foreground">Master:</span>
              <span className="font-bold">{data.ai_personality}</span>

              <span className="text-muted-foreground">Initial Lock:</span>
              <span className="font-bold">{data.initial_lock_goal_hours} Hours</span>

              <span className="text-muted-foreground">Regimens:</span>
              <span className="font-bold">{data.regimens.length} Selected</span>
            </div>

            <Separator />

            <div>
              <span className="text-muted-foreground block mb-1">Hard Limits:</span>
              <div className="flex flex-wrap gap-1">
                {data.hard_limits.length > 0 ? (
                  data.hard_limits.map(l => <span key={l} className="px-2 py-0.5 bg-destructive/10 text-destructive rounded text-xs">{l}</span>)
                ) : <span className="text-xs text-muted-foreground">None</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent flex justify-center pb-8">
        <Button
          size="lg"
          className={cn(
            "w-full max-w-sm h-16 text-xl font-black uppercase tracking-widest transition-all duration-700 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary),0.5)] transform hover:scale-105",
            isLocked ? "bg-primary text-primary-foreground scale-100" : "bg-primary"
          )}
          onClick={handleLockIn}
          disabled={loading || isLocked}
        >
          {loading ? (
             <Loader2 className="animate-spin mr-2" />
          ) : isLocked ? (
             <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-500">
               <Lock className="w-6 h-6 fill-current" />
               <span>LockedIn</span>
             </div>
          ) : (
             <div className="flex items-center gap-2">
               <Unlock className="w-6 h-6 opacity-50" />
               <span>Lock In</span>
             </div>
          )}
        </Button>
      </div>
    </div>
  )
}
