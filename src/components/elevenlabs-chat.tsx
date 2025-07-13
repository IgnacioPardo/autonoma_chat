
'use client';
import { AnimatePresence, motion } from 'framer-motion';

import { useConversation } from '@elevenlabs/react';
import { useCallback, useState } from 'react';
import { Button } from '~/components/ui/button';
import Image from 'next/image';

interface ElevenLabsChatProps {
  onTranscript?: (text: string) => void;
  agentId?: string;
}

export function ElevenLabsChat({ 
  onTranscript, 
  agentId = 'agent_01k00qg3reeg0t59c7ra8vhsnn'
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
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({ agentId });
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

  // Animación para el orb
  const orbVariants = {
    initial: { scale: 0.95, opacity: 0.7 },
    connected: { scale: 1.1, opacity: 1 },
    speaking: { scale: 1.18, opacity: 1 },
    disconnected: { scale: 1, opacity: 0.7 },
  };

  let orbState: keyof typeof orbVariants = 'initial';
  if (conversation.status === 'connected') orbState = conversation.isSpeaking ? 'speaking' : 'connected';
  if (conversation.status === 'disconnected') orbState = 'disconnected';

  return (
    <AnimatePresence>
      <motion.div
        className="flex flex-col items-center justify-between h-full w-full p-8 space-y-6"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <Image src="/autonoma_logo.png" alt="Autonoma" width={160} height={40} />
        </motion.div>

        {error && (
          <motion.div
            className="w-full p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          {/* Animated Orb */}
          <motion.div
            className={`orb w-[160px] sm:w-[180px] md:w-[240px] h-[160px] sm:h-[180px] md:h-[240px]`}
            variants={orbVariants}
            initial="initial"
            animate={orbState}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />

          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <Button
              onClick={conversation.status === 'disconnected' ? startConversation : stopConversation}
              disabled={conversation.status === 'connecting'}
              variant={conversation.status === 'connected' ? "destructive" : "default"}
              className="px-8 py-4 text-lg rounded-full bg-primary-violet text-white hover:bg-primary-violet/90 transition-colors cursor-pointer"
            >
              {conversation.status === 'connecting' ? 'Connecting...' : 
                conversation.status === 'connected' ? 'Stop Voice Chat' : 'Start Voice Chat'}
            </Button>
          </motion.div>

          <motion.div
            className="flex flex-col items-center space-y-4 text-sm text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
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
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
