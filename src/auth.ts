import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "~/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
    redirect: ({ url, baseUrl }) => {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    signIn: async ({ user, account }) => {
      try {
        console.log("SignIn callback:", {
          user: user.email,
          account: account?.provider,
        });
        return true;
      } catch (error) {
        console.error("SignIn error:", error);
        return false;
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Redirect errors back to sign in page
  },
  session: {
    strategy: "database",
  },
  debug: process.env.NODE_ENV === "development",
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log("User signed in:", {
        email: user.email,
        isNewUser,
        provider: account?.provider,
      });
    },
    async signOut({ session }) {
      console.log("User signed out:", { email: session?.user?.email });
    },
  },
};
