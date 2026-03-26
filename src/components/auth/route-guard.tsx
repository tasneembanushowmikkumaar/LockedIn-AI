"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { Loader2 } from "lucide-react"

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth()
  const profile = useQuery(api.users.current)
  const isProfileLoading = profile === undefined

  useEffect(() => {
    if (isAuthLoading || isProfileLoading) return

    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (profile && !profile.onboarding_completed && pathname !== "/onboarding") {
      router.push("/onboarding")
      return
    }
  }, [router, pathname, isAuthenticated, isAuthLoading, profile, isProfileLoading])

  const loading = isAuthLoading || isProfileLoading

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{isAuthenticated && children}</>
}
