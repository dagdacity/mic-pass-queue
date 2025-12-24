import { Crown, LogOut, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MicrophoneVisual } from '@/components/MicrophoneVisual';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { QueueList } from '@/components/QueueList';
import { AudioReceiver } from '@/components/AudioReceiver';
import { useRoom } from '@/hooks/useRoom';

export default function Index() {
  const {
    room,
    queue,
    isHost,
    loading,
    becomeHost,
    leaveHost,
    approveSpeaker,
    rejectSpeaker,
  } = useRoom();

  const speakingItem = queue.find(item => item.status === 'speaking');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl animate-pulse">
          <MicrophoneVisual size="md" />
          <p className="text-muted-foreground mt-4 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  // Show host view
  if (isHost && room) {
    return (
      <div className="min-h-screen p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Host Mode</h1>
                <p className="text-sm text-muted-foreground">Manage your speakers</p>
              </div>
            </div>
            <Button variant="glass" onClick={leaveHost}>
              <LogOut className="w-4 h-4 mr-2" />
              Leave Host
            </Button>
          </header>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Main visualization */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center glass-card p-8 rounded-2xl animate-scale-in">
              <MicrophoneVisual isActive={!!speakingItem} size="lg" />
              {speakingItem ? (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">Now Speaking</p>
                  <p className="text-xl font-semibold text-foreground">{speakingItem.display_name}</p>
                  <div className="mt-4">
                    <AudioReceiver roomId={room.id} />
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-muted-foreground">Waiting for speaker...</p>
              )}
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <QRCodeDisplay roomId={room.id} />
            </div>

            {/* Queue */}
            <div className="lg:col-span-3">
              <QueueList
                queue={queue}
                onApprove={approveSpeaker}
                onReject={rejectSpeaker}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show "room exists but not host" message
  if (room && !isHost) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card p-12 rounded-2xl text-center max-w-md animate-fade-in">
          <div className="p-4 rounded-full bg-accent/20 w-fit mx-auto mb-6">
            <Radio className="w-12 h-12 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Session Active</h1>
          <p className="text-muted-foreground mb-6">
            Someone is already hosting. Scan the QR code or use the join link to enter the queue.
          </p>
          <div className="text-sm text-muted-foreground">
            Or wait for the current session to end.
          </div>
        </div>
      </div>
    );
  }

  // Show landing / become host view
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-lg animate-fade-in">
        <div className="float mb-8">
          <MicrophoneVisual size="lg" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          <span className="text-gradient">Open Mic</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Host a live microphone session. Let others join the queue and speak to you in real-time.
        </p>

        <Button variant="host" size="xl" onClick={becomeHost}>
          <Crown className="w-6 h-6 mr-2" />
          Become the Host
        </Button>

        <p className="text-sm text-muted-foreground mt-6">
          The first person to click becomes the host and can manage speakers.
        </p>
      </div>
    </div>
  );
}
