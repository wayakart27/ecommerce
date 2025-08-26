import { Suspense } from "react"
import { SignUpForm } from "@/components/auth/signup-form"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
              <div className="space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-10 bg-muted animate-pulse rounded" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
            </div>
          }
        >
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  )
}
