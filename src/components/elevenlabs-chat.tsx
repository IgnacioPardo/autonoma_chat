'use client';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState } from 'react';
import { Button } from '~/components/ui/button';

interface ElevenLabsChatProps {
  onTranscript?: (text: string) => void;
  agentId?: string;
}

export function ElevenLabsChat({ 
  onTranscript, 
  agentId = 'agent_01k00qg3reeg0t59c7ra8vhsnn' // Your actual agent ID
}: ElevenLabsChatProps) {
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs');
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs');
    },
    onMessage: (message) => {
      console.log('Message from agent:', message);
      
      // For now, we'll handle the basic message structure
      // The exact structure depends on your ElevenLabs agent configuration
      onTranscript?.(message.message);
    },
    onError: (error) => {
      console.error('ElevenLabs error:', error);
      setError(typeof error === 'string' ? error : 'An error occurred with the voice chat');
    },
  });

  const startConversation = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with your agent
      await conversation.startSession({
        agentId: agentId, // You need to replace this with your actual agent ID
      });

    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError('Failed to start conversation. Please check your microphone permissions.');
    }
  }, [conversation, agentId]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setError(null);
    } catch (error) {
      console.error('Failed to stop conversation:', error);
    }
  }, [conversation]);

  return (
    <div className="flex flex-col items-center justify-between h-full w-full p-8 space-y-6">
      <div className="flex items-center justify-center">
        <img 
          src="/autonoma_logo.png" 
          alt="Autonoma" 
          className="w-auto"
        />
      </div>
      
      {error && (
        <div className="w-full p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        {/* Animated Orb */}
        {/* https://www.tiktok.com/@ui_vibes/video/7256847991510748422 */}
        <div className={`orb w-[160px] sm:w-[180px] md:w-[240px] h-[160px] sm:h-[180px] md:h-[240px] ${conversation.status === 'connected' ? 'orb-active' : ''} ${conversation.isSpeaking ? 'orb-speaking' : ''}`}></div>
        
        <div className="flex justify-center">
          <Button
            onClick={conversation.status === 'disconnected' ? startConversation : stopConversation}
            disabled={conversation.status === 'connecting'}
            variant={conversation.status === 'connected' ? "destructive" : "default"}
            className="px-8 py-4 text-lg rounded-full bg-primary-violet text-white hover:bg-primary-violet/90 transition-colors cursor-pointer"
          >
            {conversation.status === 'connecting' ? 'Connecting...' : 
             conversation.status === 'connected' ? 'Stop Voice Chat' : 'Start Voice Chat'}
          </Button>
        </div>

        <div className="flex flex-col items-center space-y-4 text-sm text-gray-600">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${
              conversation.status === 'connected' ? 'bg-green-500' : 
              conversation.status === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
            }`}></div>
            <span className="font-medium">Status: {conversation.status}</span>
          </div>
          
          {conversation.status === 'connected' && (
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                conversation.isSpeaking ? 'bg-primary-violet-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span>Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}</span>
            </div>
          )}
        </div>
      </div>

      {/* {conversation.status === 'connected' && (
        <div className="text-center text-sm text-gray-500 max-w-xs leading-relaxed">
          🎤 Voice chat is active. Speak naturally with the AI agent. 
          The agent will respond with voice and you can hear the responses.
        </div>
      )} */}
    </div>
  );
}
