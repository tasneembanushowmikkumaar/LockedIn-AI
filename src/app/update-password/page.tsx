"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"
import { Loader2 } from "lucide-react"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    } else {
      toast({
        title: "Success",
        description: "Your password has been updated. Please login.",
      })
      router.push("/login")
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground relative">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">

        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border shadow-lg mb-4">
            <Logo className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Set New Key</h1>
          <p className="text-muted-foreground text-sm">Create a secure new password for your account.</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6 bg-card/30 p-8 rounded-xl border border-border/50 backdrop-blur-sm shadow-xl">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-input focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-background/50 border-input focus:ring-primary"
            />
          </div>

          <Button type="submit" className="w-full h-12 font-bold text-lg bg-primary hover:bg-primary/90 transition-all" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "UPDATE PASSWORD"}
          </Button>
        </form>
      </div>
    </div>
  )
}
