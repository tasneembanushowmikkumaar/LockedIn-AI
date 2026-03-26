"use client"

import Link from "next/link"
import { SignUp } from "@clerk/nextjs"
import { Logo } from "@/components/logo"

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground relative">
      <div className="w-full max-w-sm flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/">
            <div className="p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border shadow-lg mb-4">
              <Logo className="w-12 h-12 text-primary" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Submit Yourself</h1>
          <p className="text-muted-foreground text-sm">Create your subject profile.</p>
        </div>

        <SignUp routing="hash" />
      </div>
    </div>
  )
}
