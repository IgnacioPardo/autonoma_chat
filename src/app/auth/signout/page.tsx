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
    <div className="min-h-screen flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat z-0 scale-110 blur-sm"></div>
      
      <div className="relative z-10 bg-white/50 backdrop-blur-md rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 p-2">
            <Image 
                src="/autonoma_logo.png" 
                alt="Autonoma Chat" 
                width={240}
                height={40}
                className="mx-auto mb-4"
            />
          </div>
          <p className="text-gray-900">
            Cerrando sesión...
          </p> 
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
              <LogOut className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-700 text-sm">
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
