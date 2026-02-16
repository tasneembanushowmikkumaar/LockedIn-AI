"use client"

import { OnboardingProvider } from "./context"
import { Logo } from "@/components/logo"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Simple Header */}
        <header className="p-6 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-card/50 neumorphic-flat">
              <Logo className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-muted-foreground uppercase text-xs">
              System Initialization
            </span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/50">
            SECURE_MODE_ACTIVE
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
           {/* Background noise/grid */}
           <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.05] pointer-events-none" />

           <div className="w-full max-w-lg relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {children}
           </div>
        </main>
      </div>
    </OnboardingProvider>
  )
}
