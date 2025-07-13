"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { Github } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

// Google Icon Component
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

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
    <div className="min-h-screen flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat z-0 scale-110 blur-sm"></div>
      
      <div className="relative z-10 bg-white/50 backdrop-blur-md rounded-2xl p-8 w-full max-w-md mx-4 border border-white/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4  p-2">
            <Image 
                src="/autonoma_logo.png" 
                alt="Autonoma Chat" 
                width={240}
                height={40}
                className="mx-auto mb-4"
            />
        </div>
          {/* <h1 className="text-2xl font-bold text-white mb-2">
            Bienvenido a Autonoma Chat
          </h1>
          */}
          <p className="text-gray-900">
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
                {provider.name === "Google" && <GoogleIcon />}
                Continuar con {provider.name}
              </button>
            ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Solo usuarios registrados pueden acceder
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
