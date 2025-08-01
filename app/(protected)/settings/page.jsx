'use client';

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const Page = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    // Sign out using next-auth's signOut function
    await signOut();  // Redirect after sign-out
  };

  // Display loading state while session is loading
  if (status === "loading") {
    return <div>Loading session...</div>;
  }

  // Handle the case when the user is not signed in
  if (!session) {
    return <div>You are not logged in. Please log in.</div>;
  }

  return (
    <div>
      <div>
        <strong>Session Data:</strong> <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>
      <button onClick={handleSignOut}>Sign out</button>
    </div>
  );
};

export default Page;
