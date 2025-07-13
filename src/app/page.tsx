"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "~/components/chat-sidebar";
import NavBar from "~/components/navbar";
import ChatView from "~/components/chat-view";
import AuthGuard from "~/components/auth-guard";
import type { ChatHistory } from "~/lib/chat-history";
import {
  handleChatDeleted,
} from "~/lib/chat-handlers";

export default function HomePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

  const onSelectChat = async (chat: ChatHistory) => {
    // Navigate to the chat page with the chat ID using Next.js router
    router.push(`/chat/${chat.id}`);
  };

  const onChatDeleted = (deletedChatId: string) => {
    handleChatDeleted(deletedChatId, currentChatId, setCurrentChatId);
  };

  const onNewChat = () => {
    setCurrentChatId(null);
  };

  const handleChatIdChange = (newChatId: string | null) => {
    setCurrentChatId(newChatId);
    // URL replacement is handled inside ChatView component when shouldReplaceUrl=true
  };

  const handleSidebarRefreshTrigger = () => {
    setSidebarRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        {/* Chat Sidebar */}
        <ChatSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectChat={onSelectChat}
          onNewChat={onNewChat}
          currentChatId={currentChatId ?? undefined}
          onChatDeleted={onChatDeleted}
          refreshTrigger={sidebarRefreshTrigger}
        />

        {/* background */}
        <div className="animate-in fade-in fixed inset-0 z-0 scale-110 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat blur-sm duration-300"></div>

        {/* NavBar */}
        <NavBar
          onOpenSidebar={() => setSidebarOpen(true)}
          isSaving={isSaving}
        />

        <div className="pb-safe animate-in fade-in z-1 flex h-screen w-full flex-col items-center justify-start overflow-hidden pt-16 duration-300 sm:w-4/5 md:w-2/3">
          <ChatView
            chatId={currentChatId}
            onChatIdChange={handleChatIdChange}
            onSidebarRefreshTrigger={handleSidebarRefreshTrigger}
            onSavingStateChange={setIsSaving}
            shouldReplaceUrl={true}
          />
        </div>
      </div>
    </AuthGuard>
  );
}
