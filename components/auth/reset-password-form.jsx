"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/schemas/authSchema";
import Link from "next/link";
import { KeyRound } from "lucide-react";
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
import { forgotPassword } from "@/actions/auth";
import Image from "next/image";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await forgotPassword(data);
      
      if (response?.success) {
        toast.success("Reset Link Sent", {
          description: response.message || "Check your email for a link to reset your password.",
        });
        setIsSubmitted(true);
      } else {
        toast.error("Reset Failed", {
          description: response?.message || "There was a problem sending the reset link. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Reset Failed", {
        description: error.message || "There was a problem sending the reset link. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-4 flex flex-col items-center">
        <Image
          src="https://res.cloudinary.com/djr7uqara/image/upload/v1753889584/simy5xzhfzlxxpdpgvlg.png"
          alt="Logo"
          width={120}
          height={60}
          className="rounded-lg object-cover"
        />
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {isSubmitted ? (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <KeyRound className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium">Check your email</h3>
            <p className="text-muted-foreground">
              We've sent a password reset link to your email address. Please check your inbox.
            </p>
            <Button variant="outline" className="mt-2" onClick={() => setIsSubmitted(false)}>
              Try another email
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sending reset link...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Send Reset Link
                  </span>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}