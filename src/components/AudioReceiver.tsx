import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AudioReceiverProps {
  roomId: string;
}

export function AudioReceiver({ roomId }: AudioReceiverProps) {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isReceiving, setIsReceiving] = useState(false);

  useEffect(() => {
    const channel = supabase.channel(`audio-${roomId}`);
    
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
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return (
    <div className="glass-card p-4 rounded-xl flex items-center gap-4 animate-fade-in">
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
  );
}
