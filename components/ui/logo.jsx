import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export function Logo({ size = "md", showText = true }) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }

  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="rounded-full bg-primary p-1">
        <ShieldCheck className={`${sizeClasses[size]} text-primary-foreground`} />
      </div>
      {showText && <span className={`font-bold ${textSizeClasses[size]}`}>SecureAuth</span>}
    </Link>
  )
}
