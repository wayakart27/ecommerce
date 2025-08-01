'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { newPassword } from "@/actions/auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { passwordResetSchema } from "@/schemas/authSchema";
import Link from "next/link";

export default function NewPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState(null);
  const [invalidToken, setInvalidToken] = useState(false);

  const form = useForm({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: "",
      confirmPassword: ""
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get("token");
      
      if (!tokenParam) {
        setInvalidToken(true);
        toast.error("Invalid or expired password reset link");
      } else {
        setToken(tokenParam);
      }
    }
  }, []);

  const onSubmit = async (values) => {
    if (!token) {
      toast.error("Missing reset token");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await newPassword(token, {
        password: values.password,
        confirmPassword: values.confirmPassword
      });

      if (result?.success) {
        toast.success("Password reset successful");
        setTimeout(() => router.push("/auth/login"), 1500);
      } else {
        toast.error(result?.message || "Failed to reset password");
      }
    } catch {
      toast.error("Unexpected error. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (invalidToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <Card className="w-full max-w-md shadow-md">
          <CardHeader className="text-center">
            <img src="https://res.cloudinary.com/djr7uqara/image/upload/v1753889584/simy5xzhfzlxxpdpgvlg.png" alt="Logo" width={100} height={50} />
            <CardTitle className="text-xl mt-2">Password Reset</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-red-500">
            Invalid or missing reset token.
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/auth/login" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-md">
          <CardHeader className="text-center space-y-1">
  <div className="flex justify-center">
    <img
      src="https://res.cloudinary.com/djr7uqara/image/upload/v1753889584/simy5xzhfzlxxpdpgvlg.png"
      alt="Logo"
      width={100}
      height={50}
      className="mx-auto"
    />
  </div>
  <CardTitle className="text-2xl font-semibold">Reset Password</CardTitle>
  <CardDescription>Enter your new password below</CardDescription>
</CardHeader>

          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute right-2 top-2.5 text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          className="absolute right-2 top-2.5 text-muted-foreground"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </span>
                  ) : 'Reset Password'}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="justify-center">
            <Link href="/auth/login" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
