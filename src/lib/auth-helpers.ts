import { getServerSession } from "next-auth";
import { authOptions } from "~/auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  // In development, create a fake user if none exists
  if (process.env.NODE_ENV === "development" && !user) {
    return {
      id: "dev-user-id",
      name: "Development User",
      email: "dev@example.com",
    };
  }
  
  if (!user || !('id' in user)) {
    throw new Error("Authentication required");
  }
  
  return user as { id: string; name?: string | null; email?: string | null; image?: string | null };
}
