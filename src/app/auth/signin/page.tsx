"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { Github } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export default function SignIn() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);

  useEffect(() => {
    const setAuthProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    setAuthProviders().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Background */}
      <div className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat z-0 scale-110 blur-sm opacity-30"></div>
      
      <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20">
        <div className="text-center mb-8">
          <img 
            src="/autonoma_logo.png" 
            alt="Autonoma Chat" 
            className="h-16 w-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">
            Bienvenido a Autonoma Chat
          </h1>
          <p className="text-gray-300">
            Inicia sesión para continuar
          </p>
        </div>

        <div className="space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <button
                key={provider.name}
                onClick={() => signIn(provider.id, { callbackUrl: "/" })}
                className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 border border-gray-600"
              >
                {provider.name === "GitHub" && <Github className="w-5 h-5" />}
                Continuar con {provider.name}
              </button>
            ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Solo usuarios registrados pueden acceder en producción
          </p>
        </div>
      </div>
    </div>
  );
}
