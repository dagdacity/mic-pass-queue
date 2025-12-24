import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface AudioReceiverProps {
  roomId: string;
}

export function AudioReceiver({ roomId }: AudioReceiverProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!isListening) {
      // Clean up channel when not listening
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsReceiving(false);
      setAudioLevel(0);
      return;
    }

    const channel = supabase.channel(`audio-${roomId}`);
    channelRef.current = channel;
    
    channel
      .on('broadcast', { event: 'audio-level' }, (payload) => {
        setAudioLevel(payload.payload.level);
        setIsReceiving(true);
      })
      .subscribe();

    // Reset receiving state after no updates
    let timeout: NodeJS.Timeout;
    const checkReceiving = setInterval(() => {
      timeout = setTimeout(() => {
        setIsReceiving(false);
        setAudioLevel(0);
      }, 500);
    }, 1000);

    return () => {
      clearInterval(checkReceiving);
      clearTimeout(timeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, isListening]);

  if (!isListening) {
    return (
      <Button 
        variant="host" 
        size="lg" 
        onClick={() => setIsListening(true)}
        className="animate-fade-in"
      >
        <Headphones className="w-5 h-5 mr-2" />
        Start Listening
      </Button>
    );
  }

  return (
    <div className="glass-card p-4 rounded-xl animate-fade-in">
      <div className="flex items-center gap-4 mb-3">
        <div className={`p-2 rounded-full ${isReceiving ? 'bg-success/20' : 'bg-muted'}`}>
          {isReceiving ? (
            <Volume2 className="w-5 h-5 text-success" />
          ) : (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-foreground mb-1">
            {isReceiving ? 'Receiving Audio' : 'Waiting for speaker...'}
          </p>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-success to-primary transition-all duration-75"
              style={{ width: `${audioLevel}%` }}
            />
          </div>
        </div>
      </div>
      <Button 
        variant="glass" 
        size="sm" 
        onClick={() => setIsListening(false)}
        className="w-full"
      >
        <VolumeX className="w-4 h-4 mr-2" />
        Stop Listening
      </Button>
    </div>
  );
}
