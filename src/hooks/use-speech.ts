import { useState, useRef, useCallback, useEffect } from "react";
import { getCurrentVoice } from "../components/voice-settings";

interface UseSpeechReturn {
  // Speech-to-Text
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  isSupported: boolean;

  // Text-to-Speech
  isPlaying: boolean;
  isTTSLoading: boolean;
  playText: (text: string) => Promise<void>;
  stopSpeaking: () => void;
}

export function useSpeech(): UseSpeechReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if Speech Recognition is supported after hydration
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setIsSupported(supported);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "es-ES"; // Spanish

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result?.[0]) {
            const transcript = result[0].transcript;
            if (result.isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        // Handle different types of speech recognition errors gracefully
        switch (event.error) {
          case "network":
            // Network errors are common, don't spam console
            console.warn(
              "Speech recognition: Network connection required for voice input",
            );
            break;
          case "not-allowed":
            console.warn("Speech recognition: Microphone access denied");
            break;
          case "no-speech":
            // User didn't speak, this is normal
            break;
          case "aborted":
            // User cancelled, this is normal
            break;
          default:
            console.warn("Speech recognition error:", event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.warn("Failed to start speech recognition:", error);
      setIsListening(false);
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const playText = useCallback(async (text: string) => {
    try {
      setIsTTSLoading(true);

      const selectedVoice = getCurrentVoice();

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, voice: selectedVoice }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setIsTTSLoading(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      setIsTTSLoading(false);
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsTTSLoading(false);
      setIsPlaying(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    transcript,
    isSupported,
    isPlaying,
    isTTSLoading,
    playText,
    stopSpeaking,
  };
}
