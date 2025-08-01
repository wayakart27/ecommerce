import { SignUpForm } from "@/components/auth/signup-form";


export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </div>
  )
}
