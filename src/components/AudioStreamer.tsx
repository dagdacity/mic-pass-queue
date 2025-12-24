import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from './ui/button';
import { MicrophoneVisual } from './MicrophoneVisual';
import { supabase } from '@/integrations/supabase/client';

interface AudioStreamerProps {
  roomId: string;
  isHost: boolean;
  queueItemId?: string;
  onStartSpeaking?: () => void;
}

export function AudioStreamer({ roomId, isHost, queueItemId, onStartSpeaking }: AudioStreamerProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Cleanup function
  const stopStreaming = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsStreaming(false);
    setAudioLevel(0);
  }, []);

  // Start streaming
  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setHasPermission(true);

      // Create audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      setIsStreaming(true);

      // Notify that speaking started
      if (onStartSpeaking) {
        onStartSpeaking();
      }

      // Broadcast audio level updates via Supabase Realtime
      const broadcastChannel = supabase.channel(`audio-${roomId}`);
      
      const updateAudioLevel = () => {
        if (!analyserRef.current || !isStreaming) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const normalizedLevel = Math.min(100, Math.round(average * 1.5));
        setAudioLevel(normalizedLevel);
        
        // Broadcast to host
        broadcastChannel.send({
          type: 'broadcast',
          event: 'audio-level',
          payload: { level: normalizedLevel, sessionId: queueItemId },
        });
        
        if (mediaStreamRef.current) {
          requestAnimationFrame(updateAudioLevel);
        }
      };

      await broadcastChannel.subscribe();
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setHasPermission(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  if (hasPermission === false) {
    return (
      <div className="glass-card p-8 rounded-2xl text-center animate-fade-in">
        <MicOff className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Microphone Access Denied</h3>
        <p className="text-muted-foreground">
          Please enable microphone access in your browser settings to use this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <MicrophoneVisual isActive={isStreaming} size="lg" />
      
      {/* Audio level indicator */}
      {isStreaming && (
        <div className="w-48 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-success transition-all duration-75"
            style={{ width: `${audioLevel}%` }}
          />
        </div>
      )}

      <div className="flex gap-4">
        {!isStreaming ? (
          <Button variant="host" size="xl" onClick={startStreaming}>
            <Mic className="w-6 h-6 mr-2" />
            Start Speaking
          </Button>
        ) : (
          <Button variant="destructive" size="xl" onClick={stopStreaming}>
            <MicOff className="w-6 h-6 mr-2" />
            Stop Speaking
          </Button>
        )}
      </div>

      {isStreaming && (
        <p className="text-sm text-success flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          You're live! The host can hear you.
        </p>
      )}
    </div>
  );
}
