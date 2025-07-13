"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingIndicator from "./loading-indicator";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // In development, always allow access
  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Only enforce auth in production
    if (!isDevelopment && status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router, isDevelopment]);

  // Show loading while checking session
  if (!isDevelopment && status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="fixed inset-0 z-0 scale-110 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat opacity-30 blur-sm"></div>
        <div className="relative z-10">
          <LoadingIndicator isLoading={true} />
        </div>
      </div>
    );
  }

  // In development, always show children
  // In production, only show if authenticated
  if (isDevelopment || session) {
    return <>{children}</>;
  }

  // In production without session, don't render anything
  // (will redirect to signin)
  return null;
}
