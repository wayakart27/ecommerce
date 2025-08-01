"use client"

import { useRouter } from "next/navigation"
import { AlertTriangle, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  const router = useRouter()


  const handleNavigateToLogin = () => {
    try {
      router.push("/auth/login")
    } catch (error) {
      console.error("Navigation error:", error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <div className="absolute inset-0 bg-amber-100 rounded-full animate-pulse" />
          <div className="relative z-10 flex items-center justify-center w-full h-full rounded-full border-4 border-background shadow-lg bg-white">
            <AlertTriangle className="h-16 w-16 text-amber-500" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          <span className="block">Something went wrong!</span>
        </h1>

        <p className="mt-4 text-muted-foreground">
          We{"'"}re sorry, but we encountered an unexpected error. Our team has been notified.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center relative z-10">
          <Button variant="outline" className="gap-2" onClick={handleNavigateToLogin}>
            <Home className="h-4 w-4" />
            Back to Login Page
          </Button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          className="w-full h-auto text-muted-foreground/10"
        >
          <path
            fill="currentColor"
            fillOpacity="1"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,181.3C960,181,1056,203,1152,197.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  )
}
