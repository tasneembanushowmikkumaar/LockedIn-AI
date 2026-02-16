import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <div className="relative z-10 flex flex-col items-center space-y-12 max-w-md w-full animate-in fade-in zoom-in duration-1000">
        
        {/* Branding */}
        <div className="flex flex-col items-center space-y-4">
          <div className="p-6 rounded-full bg-card/50 backdrop-blur-sm border border-border shadow-2xl neumorphic-flat animate-pulse-red">
            <Logo className="w-24 h-24 text-primary" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary via-accent to-secondary-foreground font-headline drop-shadow-lg">
            LockedIn
          </h1>
          <p className="text-xl text-muted-foreground font-medium tracking-wide">
            Stay LockedIn.
          </p>
        </div>

        {/* Actions */}
        <div className="w-full space-y-4 pt-8">
          <Link href="/login" className="w-full block">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold tracking-wide uppercase bg-primary hover:bg-primary/90 shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
            >
              Lock In
            </Button>
          </Link>

          <Link href="/signup" className="w-full block">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-14 text-lg font-bold tracking-wide uppercase border-2 hover:bg-secondary/50 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Submit Yourself
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="pt-12 text-center text-xs text-muted-foreground/50">
          <p>By entering, you confirm you are 18+ and consent to the terms.</p>
        </div>
      </div>
    </div>
  )
}
