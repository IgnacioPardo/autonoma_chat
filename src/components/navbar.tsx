"use client";

import Image from "next/image";
import { MessageSquare, LogOut, User, Settings, Share2 } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import VoiceSettings from "./voice-settings";
import { toastUtils } from "~/lib/toast-utils";

interface NavBarProps {
  onOpenSidebar: () => void;
  isSaving?: boolean;
  currentChatId?: string | null;
}

export default function NavBar({ onOpenSidebar, isSaving, currentChatId }: NavBarProps) {
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const isDevelopment = process.env.NODE_ENV === "development";

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const handleShareChat = async () => {
    if (!currentChatId) {
      toastUtils.error("No hay chat para compartir");
      return;
    }

    try {
      // First, mark the chat as shared
      const response = await fetch(`/api/chats/${currentChatId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isShared: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to share chat");
      }

      // Then copy the share link
      const shareUrl = `${window.location.origin}/chat/${currentChatId}?shared=true`;
      
      await navigator.clipboard.writeText(shareUrl);
      toastUtils.success("Chat marcado como público y enlace copiado al portapapeles");
    } catch (error) {
      console.error("Error sharing chat:", error);
      toastUtils.error("Error al compartir chat");
    }
  };

  return (
    <nav className="animate-in fade-in fixed top-0 z-[60] flex w-full items-center bg-white p-4 shadow-md duration-300">
      {/* Left section */}
      <div className="flex w-1/3 items-center gap-2">
        <button
          onClick={onOpenSidebar}
          className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-100"
          title="Historial de chats"
        >
          <MessageSquare size={20} className="text-primary-violet" />
          <span className="hidden text-sm text-gray-600 sm:inline">
            Historial
          </span>
        </button>
        
        {/* Share button - only show when there's a chat */}
        {currentChatId && (
          <button
            onClick={handleShareChat}
            className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-100"
            title="Compartir chat"
          >
            <Share2 size={18} className="text-primary-blue" />
            <span className="hidden text-xs text-gray-600 sm:inline">Compartir</span>
          </button>
        )}
      </div>

      {/* Center section */}
      <div className="flex w-1/3 justify-center items-center">
        <Image src="/autonoma_logo.png" alt="Logo" width={160} height={40} />
      </div>

      {/* Right section */}
      <div className="flex w-1/3 items-center justify-end gap-4">
        {/* Indicador de guardado sutil */}
        {isSaving && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="border-primary-violet h-3 w-3 animate-spin rounded-full border-b"></div>
            <span className="hidden sm:inline">Guardando</span>
          </div>
        )}

        {/* Voice settings button */}
        <button
          onClick={() => setShowVoiceSettings(true)}
          className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-100"
          title="Configuración de voz"
        >
          <Settings size={20} className="text-primary-violet" />
          <span className="hidden text-sm text-gray-600 sm:inline">Voz</span>
        </button>

        {/* User menu - show login button in development */}
        {isDevelopment && !session ? (
          <button
            onClick={() => (window.location.href = "/auth/signin")}
            className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          >
            <User size={20} />
            Probar Login
          </button>
        ) : (
          (!isDevelopment || session) && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-gray-100"
              >
                <User size={20} className="text-primary-violet" />
                {!isDevelopment && (
                  <span className="hidden text-sm text-gray-600 sm:inline">
                    {session?.user?.name ?? "Usuario"}
                  </span>
                )}
                {isDevelopment && (
                  <span className="hidden text-sm text-gray-600 sm:inline">
                    Desarrollo
                  </span>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {!isDevelopment && session && (
                    <>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
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
          )
        )}
      </div>

      {/* Voice Settings Modal */}
      <VoiceSettings
        isOpen={showVoiceSettings}
        onClose={() => setShowVoiceSettings(false)}
      />
    </nav>
  );
}
