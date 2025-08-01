'use client';

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export const useCurrentUser = () => {
    const [hasRefreshed, setHasRefreshed] = useState(false);
    const session = useSession();

    useEffect(() => {
        if (!session.data && !hasRefreshed && typeof window !== 'undefined') {
            setHasRefreshed(true);
        }
    }, [session.data, hasRefreshed]);

    const handleSignOut = async () => {
        await signOut({
            redirect: false // We'll handle redirect manually
        });
    };

    return {
        user: session.data?.user,
        isLoading: session.status === 'loading',
        signOut: handleSignOut
    };
};