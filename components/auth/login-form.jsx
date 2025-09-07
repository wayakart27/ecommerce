"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { loginSchema } from "@/schemas/authSchema";
import { login, resendTwoFactorCode } from "@/actions/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";

export function LoginForm() {
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState(DEFAULT_LOGIN_REDIRECT);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [email, setEmail] = useState("");
  const [codeDigits, setCodeDigits] = useState(Array(6).fill(""));
  const [isMounted, setIsMounted] = useState(false);
  const inputRefs = useRef([]);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);

    // Replace useSearchParams
    const params = new URLSearchParams(window.location.search);
    const cb = params.get("callbackUrl");
    if (cb) setCallbackUrl(cb);
  }, []);

  useEffect(() => {
    if (showTwoFactor && isMounted) {
      inputRefs.current[0]?.focus();
    }
  }, [showTwoFactor, isMounted]);

  useEffect(() => {
    if (codeDigits.every((digit) => digit !== "") && codeDigits.length === 6 && isMounted) {
      onTwoFactorSubmit();
    }
  }, [codeDigits, isMounted]);

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").replace(/\D/g, "");
    const digits = pasteData.split("").slice(0, 6);
    if (digits.length === 6) {
      const newDigits = [...codeDigits];
      digits.forEach((digit, index) => (newDigits[index] = digit));
      setCodeDigits(newDigits);
      form.setValue("code", newDigits.join(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...codeDigits];
    newDigits[index] = value;
    setCodeDigits(newDigits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    form.setValue("code", newDigits.join(""));
  };

  const handleCodeKeyDown = (index, e) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      const newDigits = [...codeDigits];
      newDigits[index - 1] = "";
      setCodeDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const response = await login(data, callbackUrl);

      if (response?.twoFactor) {
        setEmail(data.email);
        setShowTwoFactor(true);
      } else if (response?.error) {
        toast.error("Login Failed", { description: response.error });
      } else {
        const signInResult = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
          callbackUrl,
        });

        if (signInResult?.error) {
          toast.error("Login Failed", { description: signInResult.error });
        } else {
          router.push(callbackUrl);
        }
      }
    } catch (error) {
      toast.error("Something went wrong", { description: "Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const onTwoFactorSubmit = async () => {
    if (codeDigits.some((d) => d === "")) return;

    setIsVerifying(true);

    try {
      const response = await login(
        {
          email,
          password: form.getValues("password"),
          code: codeDigits.join(""),
        },
        callbackUrl
      );

      if (response?.error) {
        toast.error("Verification Failed", { description: response.error });
      } else {
        const signInResult = await signIn("credentials", {
          email,
          password: form.getValues("password"),
          redirect: false,
          callbackUrl,
        });

        if (signInResult?.error) {
          toast.error("Login Failed", { description: signInResult.error });
        } else {
          router.push(callbackUrl);
        }
      }
    } catch (error) {
      toast.error("Something went wrong", { description: "Please try again." });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isMounted) return null;

  return (
    <Card className="w-full max-w-md shadow-lg mx-auto my-4">
      <CardHeader className="flex flex-col items-center px-6 pt-4 pb-4 space-y-2">
        <Image src="https://res.cloudinary.com/djr7uqara/image/upload/v1757276957/x5jwhjxsbak613duhbn3.png" alt="Logo" width={120} height={60} className="rounded-lg object-cover" priority />
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">
            {showTwoFactor ? "Two-Factor Verification" : "Welcome Back"}
          </CardTitle>
          <CardDescription className="text-sm">
            {showTwoFactor ? "Enter the 6-digit code sent to your email" : "Sign in to your account to continue"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-2">
        {showTwoFactor ? (
          <div className="space-y-4">
            <div className="flex justify-center gap-2 mb-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={codeDigits[index]}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-xl font-semibold"
                  autoComplete="one-time-code"
                  disabled={isVerifying || isResending}
                />
              ))}
            </div>

            <div className="flex justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTwoFactor(false);
                  setCodeDigits(Array(6).fill(""));
                }}
                disabled={isVerifying || isResending}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onTwoFactorSubmit}
                disabled={isVerifying || isResending || codeDigits.some((d) => d === "")}
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Verifying...
                  </span>
                ) : (
                  "Verify"
                )}
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Didn't receive a code?{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={async () => {
                  try {
                    setIsResending(true);
                    const response = await resendTwoFactorCode(email);
                    if (response.success) {
                      toast.success("New code sent!");
                      setCodeDigits(Array(6).fill(""));
                      form.setValue("code", "");
                      inputRefs.current[0]?.focus();
                    }
                  } catch {
                    toast.error("Failed to resend code");
                  } finally {
                    setIsResending(false);
                  }
                }}
                disabled={isResending}
              >
                {isResending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending...
                  </span>
                ) : (
                  "Resend code"
                )}
              </button>
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="your.email@example.com"
                        type="email"
                        autoComplete="email"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          {...field}
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end pb-2">
                <Link href="/auth/forgot-password" className="text-sm font-medium text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full h-10" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>

      {!showTwoFactor && (
        <CardFooter className="flex justify-center px-6 pb-6 pt-0">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
