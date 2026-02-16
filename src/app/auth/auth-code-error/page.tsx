import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground relative">
      <div className="w-full max-w-sm space-y-8 text-center animate-in fade-in zoom-in duration-500">

        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-destructive/10 text-destructive neumorphic-flat">
            <AlertTriangle className="w-12 h-12" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-destructive">Authentication Error</h1>
        <p className="text-muted-foreground text-sm">
          The link you used is invalid or expired. Please request a new password reset link.
        </p>

        <Link href="/forgot-password" className="block w-full">
          <Button variant="outline" className="w-full h-12 font-bold text-lg border-2 hover:bg-secondary/50 transition-all">
            TRY AGAIN
          </Button>
        </Link>

        <div className="pt-2">
            <Link href="/login" className="text-sm text-primary hover:underline">
                Back to Login
            </Link>
        </div>
      </div>
    </div>
  )
}
