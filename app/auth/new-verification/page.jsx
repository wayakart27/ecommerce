"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerificationAnimation } from "@/components/auth/verification-animation";
import { newVerification } from "@/actions/auth";
import Image from "next/image";

export default function NewVerificationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [verificationState, setVerificationState] = useState("loading");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setVerificationState("error");
                setErrorMessage("Missing verification token");
                return;
            }

            try {
                const result = await newVerification(token)

                if (result.success) {
                    setVerificationState("success");
                    // Redirect to login page after 3 seconds
                    setTimeout(() => {
                        router.push("/auth/login");
                    }, 5000);
                } else {
                    setVerificationState("error");
                    setErrorMessage(result.error || "Verification failed");
                }
            } catch (error) {
                setVerificationState("error");
                setErrorMessage("Something went wrong during verification");
            }
        };

        verifyToken();
    }, [token, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
            <div className="w-full max-w-md">
                <Card className="w-full shadow-lg">
                    <CardHeader className="space-y-1">
                        <div className="flex justify-center mb-2">
                            <Image
                               src="https://res.cloudinary.com/djr7uqara/image/upload/v1757276957/x5jwhjxsbak613duhbn3.png"
                                alt="Logo"
                                width={120}
                                height={60}
                                className="rounded-lg object-cover"
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
                        <CardDescription className="text-center">
                            {verificationState === "loading" && "We're verifying your email address"}
                            {verificationState === "success" && "Your email has been successfully verified"}
                            {verificationState === "error" && "Verification failed"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center py-4">
                        <VerificationAnimation state={verificationState} errorMessage={errorMessage} />
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        {verificationState === "success" && (
                            <p className="text-sm text-muted-foreground text-center">
                                Redirecting to login page...
                                <br />
                                <Button variant="link" className="mt-0 p-0" onClick={() => router.push("/login")}>
                                    Click here if you're not redirected
                                </Button>
                            </p>
                        )}
                        {verificationState === "error" && (
                            <Button onClick={() => router.push("/auth/login")}>Back to Login</Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
