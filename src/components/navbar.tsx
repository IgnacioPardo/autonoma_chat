"use client";

import Image from "next/image";
import { MessageSquare } from 'lucide-react';

interface NavBarProps {
  onOpenSidebar: () => void;
  isSaving?: boolean;
}

export default function NavBar({ onOpenSidebar, isSaving }: NavBarProps) {
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
      
      {/* Indicador de guardado sutil */}
      <div className="w-[120px] flex justify-end">
        {isSaving && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-primary-violet"></div>
            <span>Guardando</span>
          </div>
        )}
      </div>
    </nav>
  );
}
