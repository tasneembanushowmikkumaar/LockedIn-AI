"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Logo } from "@/components/logo"
import { Loader2, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })

    if (error) {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      })
      setLoading(false)
    } else {
      setSent(true)
      toast({
        title: "Check your email",
        description: "We've sent a password reset link to your inbox.",
      })
      setLoading(false)
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
          <h1 className="text-3xl font-bold tracking-tight">Access Recovery</h1>
          <p className="text-muted-foreground text-sm">Enter your registered email to reset your key.</p>
        </div>

        {sent ? (
          <div className="bg-card/30 p-8 rounded-xl border border-border/50 backdrop-blur-sm shadow-xl text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Mail className="w-8 h-8" />
              </div>
            </div>
            <h3 className="text-xl font-bold">Link Sent</h3>
            <p className="text-muted-foreground text-sm">
              If an account exists for <span className="text-foreground font-medium">{email}</span>, you will receive a reset link shortly.
            </p>
            <Button variant="outline" className="w-full mt-4" onClick={() => setSent(false)}>
              Try another email
            </Button>
            <div className="pt-4">
                <Link href="/login" className="text-sm text-primary hover:underline">
                    Back to Login
                </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6 bg-card/30 p-8 rounded-xl border border-border/50 backdrop-blur-sm shadow-xl">
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

            <Button type="submit" className="w-full h-12 font-bold text-lg bg-primary hover:bg-primary/90 transition-all" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "SEND RESET LINK"}
            </Button>

            <div className="text-center text-sm">
              <Link href="/login" className="font-medium text-muted-foreground hover:text-foreground transition-colors">
                Return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
