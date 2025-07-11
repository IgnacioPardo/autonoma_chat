'use client';

import Link from "next/link";
import Image from "next/image";
import { useChat } from '@ai-sdk/react';

export default function HomePage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <body className="flex w-full min-h-screen flex-col items-center justify-center">
    {/* NavBar */}
    <nav className="flex justify-center items-center w-full p-8 fixed top-0 bg-white shadow-md">
      <Image src="/autonoma_logo.png" alt="Logo" width={160} height={40} />
    </nav>
    <main className="flex min-h-screen flex-col items-center justify-start w-2/3 overflow-y-auto">
      <div className="flex flex-col w-full space-y-4 pb-24 pt-24">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
              message.role === 'user' 
                ? 'bg-gradient-to-b from-primary-blue to-primary-violet text-white rounded-br-sm' 
                : 'bg-background-light text-gray-800 border border-gray-200 rounded-bl-sm'
            }`}>
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return <div key={`${message.id}-${i}`} className="whitespace-pre-wrap">{part.text}</div>;
                }
              })}
            </div>
          </div>
        ))}
  
          <div className="fixed bottom-0 w-2/3 p-4 mb-4 bg-white/80 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex flex-row gap-3 w-full items-center">
              <input
                className="flex-1 p-4 rounded-2xl border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-violet focus:border-transparent h-[56px]"
                value={input}
                placeholder="Escribe tu mensaje..."
                onChange={handleInputChange}
              />

              <button 
                  type="submit"
                  className="flex items-center justify-center bg-gradient-to-b from-primary-blue to-primary-violet text-white px-6 py-4 rounded-2xl border border-border-violet shadow-lg h-[56px] whitespace-nowrap hover:shadow-xl transition-shadow duration-200"
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
