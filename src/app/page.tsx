"use client";

import Link from "next/link";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";

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
      <div className="fixed inset-0 bg-[url('/background.avif')] bg-cover bg-center bg-no-repeat"></div>
      {/* NavBar */}
      <nav className="fixed top-0 z-10 flex w-full items-center justify-center bg-white p-8 shadow-md">
        <Image src="/autonoma_logo.png" alt="Logo" width={160} height={40} />
      </nav>
      <main className="flex min-h-screen w-2/3 flex-col items-center justify-start overflow-y-auto">
        <div className="flex w-full flex-col space-y-4 pt-24 pb-24">
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
                            className="whitespace-pre-wrap"
                          >
                            {part.text}
                          </div>
                        );
                    }
                  })}

                  {/* Botones de acción que aparecen al hacer hover */}
                  <div
                    className={`absolute ${message.role === "user" ? "-left-12" : "-right-12"} top-2 flex flex-col gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100`}
                  >
                    <button
                      onClick={() => copyToClipboard(messageText)}
                      className="cursor-pointer rounded-full bg-white p-2 shadow-md transition-colors duration-150 hover:bg-gray-50"
                      title="Copiar mensaje"
                    >
                      <svg
                        className="h-4 w-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => shareText(messageText)}
                      className="cursor-pointer rounded-full bg-white p-2 shadow-md transition-colors duration-150 hover:bg-gray-50"
                      title="Compartir mensaje"
                    >
                      <svg
                        className="h-4 w-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="fixed bottom-0 w-full p-4 backdrop-blur-sm">
            <form
              onSubmit={handleSubmit}
              className="mb-4 flex w-2/3 flex-row items-center gap-3"
            >
              <input
                className="focus:ring-primary-violet h-[56px] flex-1 rounded-2xl border border-gray-300 p-4 shadow-sm focus:border-transparent focus:ring-2 focus:outline-none"
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
        </div>
      </main>
    </body>
  );
}
