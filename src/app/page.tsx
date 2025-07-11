"use client";

import Link from "next/link";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import MessageActions from "~/components/message-actions";
import Markdown from 'react-markdown'

export default function HomePage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Error copying text: ", err);
    }
  };

  const shareText = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mensaje de Autonoma Chat",
          text: text,
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.error("Error sharing: ", err);
        // Fallback: copiar al clipboard
        await copyToClipboard(text);
      }
    } else {
      // Fallback: copiar al clipboard
      await copyToClipboard(text);
    }
  };

  return (
    <body className="flex min-h-screen w-full flex-col items-center justify-center">
      {/* background */}
      <div className="fixed inset-0 bg-[url('/background.avif')] bg-cover bg-center bg-no-repeat z-0 scale-110 blur-sm"></div> 
      {/* NavBar */}
      <nav className="fixed top-0 z-10 flex w-full items-center justify-center bg-white p-8 shadow-md">
        <Image src="/autonoma_logo.png" alt="Logo" width={160} height={40} />
      </nav>
      <main className="flex min-h-screen w-2/3 flex-col items-center justify-start overflow-y-auto">
        <div className="flex w-full flex-col space-y-4 pt-24 pb-40">
          {messages.map((message) => {
            const messageText = message.parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("");

            return (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`group relative max-w-xs rounded-2xl px-4 py-3 lg:max-w-md ${
                    message.role === "user"
                      ? "from-primary-blue to-primary-violet rounded-br-sm bg-gradient-to-b text-white"
                      : "rounded-bl-sm border border-gray-200 bg-white/90 text-gray-800 shadow-sm backdrop-blur-sm"
                  }`}
                >
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className={`prose prose-sm max-w-none ${
                              message.role === "user" 
                                ? "prose-invert [&_code]:bg-white/20 [&_pre]:bg-white/10 [&_code]:text-gray-100" 
                                : "[&_code]:bg-gray-100 [&_pre]:bg-gray-50 [&_code]:text-gray-800"
                            }`}
                          >
                            <Markdown>
                              {part.text}
                            </Markdown>
                          </div>
                        );
                    }
                  })}

                  {/* Botones de acción que aparecen al hacer hover */}
                  <MessageActions
                    messageText={messageText}
                    isUserMessage={message.role === "user"}
                    onCopy={copyToClipboard}
                    onShare={shareText}
                  />
                </div>
              </div>
            );
          })}

        </div>
        
        {/* Background Blur behind input */}
        <div 
          className="fixed bottom-0 w-full h-[140px] backdrop-blur-xs mask-gradient"
        ></div>
        
        <div className="fixed bottom-0 w-2/3 p-4">
          <form
            onSubmit={handleSubmit}
            className="mb-4 flex w-full flex-row items-center gap-3"
          >
            <input
              className="focus:ring-primary-violet h-[56px] flex-1 rounded-2xl border border-gray-300 p-4 shadow-sm focus:border-transparent focus:ring-2 focus:outline-none backdrop-blur-xs"
              value={input}
              placeholder="Escribe tu mensaje..."
              onChange={handleInputChange}
            />

            <button
              type="submit"
              className="from-primary-blue to-primary-violet border-border-violet flex h-[56px] items-center justify-center rounded-2xl border bg-gradient-to-b px-6 py-4 whitespace-nowrap text-white shadow-lg transition-shadow duration-200 hover:shadow-xl"
            >
              Enviar
            </button>
          </form>
        </div>
      </main>
    </body>
  );
}
