"use client"

import Link from "next/link"
import { SignIn } from "@clerk/nextjs"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground relative">
      <div className="w-full max-w-sm flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/">
            <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border shadow-lg mb-4">
              <Logo className="w-12 h-12 text-primary" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Lock In</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account.</p>
        </div>

        <SignIn routing="hash" />
      </div>
    </div>
  )
}
