"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"
import { Loader2 } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isAdult, setIsAdult] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAdult) {
      toast({
        title: "Consent Required",
        description: "You must be 18+ to use this application.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    } else {
      // Create stub profile logic is handled by middleware or post-signup flow.
      // For now, we redirect to onboarding.
      toast({
        title: "Account Created",
        description: "Please check your email for verification if required.",
      })
      router.push("/onboarding")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground relative">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">

        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/">
            <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border shadow-lg mb-4">
              <Logo className="w-12 h-12 text-primary" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Submit Yourself</h1>
          <p className="text-muted-foreground text-sm">Create your subject profile.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6 bg-card/30 p-8 rounded-xl border border-border/50 backdrop-blur-sm shadow-xl">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="sub@lockedin.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50 border-input focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-input focus:ring-primary"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="adult"
              checked={isAdult}
              onCheckedChange={(checked) => setIsAdult(checked as boolean)}
              required
            />
            <Label htmlFor="adult" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              I confirm I am 18 years of age or older.
            </Label>
          </div>

          <Button type="submit" className="w-full h-12 font-bold text-lg bg-primary hover:bg-primary/90 transition-all" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "REGISTER"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already owned? </span>
            <Link href="/login" className="font-medium text-primary hover:underline underline-offset-4">
              Lock In
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
