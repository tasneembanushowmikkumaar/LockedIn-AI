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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    } else {
      router.push("/home") // Will be redirected by middleware/route guard if needed
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
          <h1 className="text-3xl font-bold tracking-tight">Lock In</h1>
          <p className="text-muted-foreground text-sm">Enter your credentials to proceed.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 bg-card/30 p-8 rounded-xl border border-border/50 backdrop-blur-sm shadow-xl">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary/80 hover:text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-input focus:ring-primary"
            />
          </div>

          <Button type="submit" className="w-full h-12 font-bold text-lg bg-primary hover:bg-primary/90 transition-all" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "AUTHENTICATE"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">New subject? </span>
            <Link href="/signup" className="font-medium text-primary hover:underline underline-offset-4">
              Submit Yourself
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
