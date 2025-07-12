"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { Github } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

function SignInContent() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    const setAuthProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    setAuthProviders().catch(console.error);
  }, []);

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Callback":
        return "Error en la configuración de OAuth. Verifica la URL de callback en GitHub.";
      case "OAuthSignin":
        return "Error al iniciar sesión con GitHub.";
      case "OAuthCallback":
        return "Error en el callback de GitHub.";
      case "OAuthCreateAccount":
        return "Error al crear la cuenta.";
      case "EmailCreateAccount":
        return "Error al crear la cuenta con email.";
      case "Signin":
        return "Error al iniciar sesión.";
      case "OAuthAccountNotLinked":
        return "Esta cuenta ya está vinculada con otro proveedor.";
      case "EmailSignin":
        return "Error al enviar email de verificación.";
      case "CredentialsSignin":
        return "Credenciales incorrectas.";
      case "SessionRequired":
        return "Debes iniciar sesión para acceder.";
      default:
        return error ? `Error desconocido: ${error}` : null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Background */}
      <div className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat z-0 scale-110 blur-sm opacity-30"></div>
      
      <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 bg-white opacity-50 backdrop-blur-lg rounded-full p-2">
            <Image 
                src="/autonoma_logo.png" 
                alt="Autonoma Chat" 
                width={64}
                height={64}
                className="mx-auto mb-4"
            />
        </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Bienvenido a Autonoma Chat
          </h1>
          <p className="text-gray-300">
            Inicia sesión para continuar
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-300 text-sm text-center">
              {getErrorMessage(error)}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <button
                key={provider.name}
                onClick={() => signIn(provider.id, { callbackUrl: "/" })}
                className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 border border-gray-600 cursor-pointer"
              >
                {provider.name === "GitHub" && <Github className="w-5 h-5" />}
                Continuar con {provider.name}
              </button>
            ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Solo usuarios registrados pueden acceder a AutonomaChat
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-white mt-4">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
