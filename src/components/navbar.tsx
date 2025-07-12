"use client";

import Image from "next/image";
import { MessageSquare, LogOut, User } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

interface NavBarProps {
  onOpenSidebar: () => void;
  isSaving?: boolean;
}

export default function NavBar({ onOpenSidebar, isSaving }: NavBarProps) {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="fixed top-0 z-10 flex w-full items-center justify-between bg-white p-8 shadow-md">
      <button
        onClick={onOpenSidebar}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        title="Historial de chats"
      >
        <MessageSquare size={20} className="text-primary-violet" />
        <span className="hidden sm:inline text-sm text-gray-600">Historial</span>
      </button>
      
      <Image src="/autonoma_logo.png" alt="Logo" width={160} height={40} />
      
      <div className="flex items-center gap-4">
        {/* Indicador de guardado sutil */}
        {isSaving && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-primary-violet"></div>
            <span>Guardando</span>
          </div>
        )}
        
        {/* User menu - show login button in development */}
        {isDevelopment && !session ? (
          <button
            onClick={() => window.location.href = '/auth/signin'}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm text-gray-600"
          >
            <User size={20} />
            Probar Login
          </button>
        ) : (!isDevelopment || session) && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "Usuario"}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <User size={20} className="text-gray-600" />
              )}
              {!isDevelopment && (
                <span className="hidden sm:inline text-sm text-gray-600">
                  {session?.user?.name ?? "Usuario"}
                </span>
              )}
              {isDevelopment && (
                <span className="hidden sm:inline text-sm text-gray-600">
                  Desarrollo
                </span>
              )}
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                {!isDevelopment && session && (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      {session.user?.email}
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </>
                )}
                {isDevelopment && (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Modo desarrollo
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
