"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import ChatSidebar from "~/components/chat-sidebar";
import NavBar from "~/components/navbar";
import ChatView from "~/components/chat-view";
import PublicChatView from "~/components/public-chat-view";
import AuthGuard from "~/components/auth-guard";
import LoadingIndicator from "~/components/loading-indicator";
import type { ChatHistory } from "~/lib/chat-history";
import { handleChatDeleted } from "~/lib/chat-handlers";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = typeof params.id === "string" ? params.id : null;
  const isSharedView = searchParams.get("shared") === "true";
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize the chat ID once params are available
  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
    }
    setIsInitializing(false);
  }, [chatId]);

  const onSelectChat = async (chat: ChatHistory) => {
    // Navigate to the selected chat using Next.js router
    router.push(`/chat/${chat.id}`);
  };

  const onChatDeleted = (deletedChatId: string) => {
    if (deletedChatId === currentChatId) {
      // If current chat was deleted, navigate to home using Next.js router
      router.push("/");
    }
  };

  const onNewChat = () => {
    // Navigate to home for new chat using Next.js router
    router.push("/");
  };

  const handleSidebarRefreshTrigger = () => {
    setSidebarRefreshTrigger((prev) => prev + 1);
  };

  const handleChatIdChange = (newChatId: string | null) => {
    setCurrentChatId(newChatId);
    if (newChatId && newChatId !== chatId) {
      // Navigate to new chat URL using Next.js router
      router.push(`/chat/${newChatId}`);
    }
  };

  // For shared view, skip auth and use public component
  if (isSharedView && chatId) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        {/* background */}
        <div className="animate-in fade-in fixed inset-0 z-0 scale-110 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat blur-sm duration-300"></div>

        <div className="pb-safe animate-in fade-in z-1 flex h-screen w-full flex-col items-center justify-start overflow-hidden duration-300 sm:w-4/5 md:w-2/3">
          <PublicChatView chatId={chatId} />
        </div>
      </div>
    );
  }

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
          currentChatId={currentChatId}
        />

        <div className="pb-safe animate-in fade-in z-1 flex h-screen w-full flex-col items-center justify-start overflow-hidden pt-16 duration-300 sm:w-4/5 md:w-2/3">
          {isInitializing ? (
            <div className="flex items-center justify-center flex-1">
              <LoadingIndicator isLoading={true} />
              <span className="ml-3 text-sm text-gray-600">Inicializando chat...</span>
            </div>
          ) : (
            <ChatView
              chatId={currentChatId}
              onChatIdChange={handleChatIdChange}
              onSidebarRefreshTrigger={handleSidebarRefreshTrigger}
              onSavingStateChange={setIsSaving}
              shouldReplaceUrl={false}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
