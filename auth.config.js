import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "./schemas/authSchema";
import { comparePasswords } from "./app/auth/password";

const isProduction = process.env.NODE_ENV === "production";

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // ✅ Required for Netlify hosting

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const validatedFields = loginSchema.safeParse(credentials);
          if (!validatedFields.success) return null;

          const { email, password } = validatedFields.data;

          // Use a base URL fallback for Netlify
          const baseUrl = isProduction
            ? "https://polite-blancmange-b543d4.netlify.app"
            : "http://localhost:3000";

          const response = await fetch(
            `${baseUrl}/api/users?email=${encodeURIComponent(email)}`
          );

          if (!response.ok) return null;

          const user = await response.json();
          if (!user?.password) return null;

          const isValid = await comparePasswords(password, user.password);
          if (!isValid) return null;

          return {
            id: user._id?.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified,
            isTwoFactorEnabled: user.isTwoFactorEnabled,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 3 * 60 * 60 // 3 hours × 60 minutes × 60 seconds
  },

  // ✅ Correct cookie name for secure Netlify sessions
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // Always true in Netlify
      },
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isVerified = user.isVerified;
        token.isTwoFactorEnabled = user.isTwoFactorEnabled;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id,
        role: token.role,
        isVerified: token.isVerified,
        isTwoFactorEnabled: token.isTwoFactorEnabled,
      };
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      return baseUrl;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  debug: !isProduction,
};
