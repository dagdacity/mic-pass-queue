import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, Clock, Check, X, Mic, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MicrophoneVisual } from '@/components/MicrophoneVisual';
import { AudioStreamer } from '@/components/AudioStreamer';
import { useQueue } from '@/hooks/useQueue';
import { supabase } from '@/integrations/supabase/client';

export default function JoinQueue() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const { myQueueItem, loading, joinQueue, leaveQueue, startSpeaking } = useQueue(roomId || null);

  // Check if room exists
  useEffect(() => {
    const checkRoom = async () => {
      if (!roomId) {
        setRoomExists(false);
        return;
      }

      const { data, error } = await supabase
        .from('rooms')
        .select('id')
        .eq('id', roomId)
        .eq('is_active', true)
        .maybeSingle();

      setRoomExists(!!data && !error);
    };

    checkRoom();
  }, [roomId]);

  const handleJoin = () => {
    if (displayName.trim()) {
      joinQueue(displayName.trim());
    }
  };

  // Room doesn't exist
  if (roomExists === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-12 rounded-2xl text-center max-w-md animate-fade-in">
          <div className="p-4 rounded-full bg-destructive/20 w-fit mx-auto mb-6">
            <X className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Session Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This session has ended or the link is invalid.
          </p>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Loading
  if (loading || roomExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl animate-pulse">
          <MicrophoneVisual size="md" />
          <p className="text-muted-foreground mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  // User is approved - show microphone
  if (myQueueItem?.status === 'approved' || myQueueItem?.status === 'speaking') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-lg">
          <div className="mb-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 text-success text-sm font-medium mb-6">
              <Check className="w-4 h-4" />
              Approved! You can speak now.
            </div>
          </div>
          
          <AudioStreamer
            roomId={roomId!}
            isHost={false}
            queueItemId={myQueueItem.id}
            onStartSpeaking={startSpeaking}
          />
          
          <Button variant="glass" className="mt-8" onClick={leaveQueue}>
            <LogOut className="w-4 h-4 mr-2" />
            Leave Queue
          </Button>
        </div>
      </div>
    );
  }

  // User was rejected
  if (myQueueItem?.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-12 rounded-2xl text-center max-w-md animate-fade-in">
          <div className="p-4 rounded-full bg-destructive/20 w-fit mx-auto mb-6">
            <X className="w-12 h-12 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Not Approved</h1>
          <p className="text-muted-foreground mb-6">
            The host didn't approve your request this time.
          </p>
          <Button variant="secondary" onClick={leaveQueue}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // User is waiting
  if (myQueueItem?.status === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-12 rounded-2xl text-center max-w-md animate-fade-in">
          <div className="p-4 rounded-full bg-primary/20 w-fit mx-auto mb-6 pulse-ring">
            <Clock className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            In Queue
          </h1>
          <p className="text-xl text-muted-foreground mb-2">{myQueueItem.display_name}</p>
          <p className="text-muted-foreground mb-6">
            Waiting for host approval...
          </p>
          <Button variant="glass" onClick={leaveQueue}>
            <LogOut className="w-4 h-4 mr-2" />
            Leave Queue
          </Button>
        </div>
      </div>
    );
  }

  // User done speaking
  if (myQueueItem?.status === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-12 rounded-2xl text-center max-w-md animate-fade-in">
          <div className="p-4 rounded-full bg-success/20 w-fit mx-auto mb-6">
            <Check className="w-12 h-12 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Thanks for Speaking!</h1>
          <p className="text-muted-foreground mb-6">
            Your turn is complete.
          </p>
          <Button variant="secondary" onClick={leaveQueue}>
            Join Queue Again
          </Button>
        </div>
      </div>
    );
  }

  // Join form
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full animate-fade-in">
        <div className="float mb-8">
          <MicrophoneVisual size="md" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Join the Queue
        </h1>
        <p className="text-muted-foreground mb-8">
          Enter your name to request speaking time.
        </p>

        <div className="glass-card p-6 rounded-2xl">
          <div className="space-y-4">
            <Input
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              className="bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground"
            />
            <Button
              variant="host"
              size="lg"
              className="w-full"
              onClick={handleJoin}
              disabled={!displayName.trim()}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Join Queue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
