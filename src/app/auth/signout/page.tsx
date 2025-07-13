"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";
import { LogOut } from "lucide-react";
import Image from "next/image";

export default function SignOutPage() {
  useEffect(() => {
    void signOut({ callbackUrl: "/" });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 z-0 scale-110 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat blur-sm"></div>

      <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-white/20 bg-white/50 p-8 backdrop-blur-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center p-2">
            <Image
              src="/autonoma_logo.png"
              alt="Autonoma Chat"
              width={240}
              height={40}
              className="mx-auto mb-4"
            />
          </div>
          <p className="text-gray-900">Cerrando sesión...</p>
        </div>

        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full border border-red-500/20 bg-red-500/10 p-4">
              <LogOut className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-b-2 border-red-600"></div>
            <p className="text-sm text-gray-700">
              Serás redirigido automáticamente...
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Gracias por usar Autonoma Chat
          </p>
        </div>
      </div>
    </div>
  );
}
