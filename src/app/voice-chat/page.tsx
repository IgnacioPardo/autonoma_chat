"use client";

import { useEffect, useState } from 'react';
import { ElevenLabsChat } from "~/components/elevenlabs-chat";
import AuthGuard from "~/components/auth-guard";
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function VoiceChatPage() {
  const [transcript, setTranscript] = useState<string>('');
  const handleVoiceTranscript = (newTranscript: string) => {
    setTranscript(newTranscript);
    console.log('Voice transcript received:', newTranscript);
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        {/* background */}
        <div className="fixed inset-0 bg-[url('/background.png')] bg-cover bg-center bg-no-repeat z-0 scale-110 blur-sm"></div> 
        
        {/* NavBar */}
        {/* <NavBar 
          onOpenSidebar={() => {}} // No sidebar on this page
          isSaving={false}
        /> */}

        <main className="flex min-h-screen w-5/6 sm:w-4/5 md:w-2/3 max-w-4xl flex-col items-center justify-start overflow-y-auto overflow-x-hidden pb-safe relative z-10">
          
          {/* Header */}
          <div className="w-full pt-8 pb-6">
            <div className="flex items-center justify-between mb-6">
              <Link 
                href="/"
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Chat</span>
              </Link>
            </div>
            
            {/* <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Mic className="h-8 w-8 text-purple-600" />
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                ElevenLabs Voice Chat
              </h1>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Have natural voice conversations with AI. Speak directly to the assistant and get voice responses in real-time.
              </p>
            </div> */}
          </div>

          {/* Voice Chat Interface */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 aspect-[3/4] flex flex-col">
              <ElevenLabsChat
                onTranscript={handleVoiceTranscript}
              />
            </div>
          </div>

          {/* Transcript Display */}
          {/* {transcript && (
            <div className="w-full max-w-2xl mt-6">
              <div className="bg-white rounded-lg shadow-md p-6 border">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <Mic className="h-5 w-5 mr-2 text-purple-600" />
                  Last Transcript
                </h3>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-gray-700">{transcript}</p>
                </div>
              </div>
            </div>
          )} */}

          {/* Audio Responses Log */}
          {/* {audioResponses.length > 0 && (
            <div className="w-full max-w-2xl mt-6">
              <div className="bg-white rounded-lg shadow-md p-6 border">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                  Voice Responses ({audioResponses.length})
                </h3>
                <div className="space-y-3">
                  {audioResponses.map((audioUrl, index) => (
                    <div key={index} className="bg-gray-50 rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Response {index + 1}</span>
                        <audio controls className="max-w-xs">
                          <source src={audioUrl} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )} */}

          {/* Instructions */}
          {/* <div className="w-full max-w-2xl mt-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">How to use Voice Chat</h3>
              <ul className="text-blue-700 space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="font-semibold">1.</span>
                  <span>Click "Start Voice Chat" to begin the conversation</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-semibold">2.</span>
                  <span>Allow microphone access when prompted</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-semibold">3.</span>
                  <span>Speak naturally - the AI will respond with voice</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-semibold">4.</span>
                  <span>Click "Stop Voice Chat" when you're done</span>
                </li>
              </ul>
            </div>
          </div> */}

        </main>
      </div>
    </AuthGuard>
  );
}
