import { Check, X, Mic, Clock } from 'lucide-react';
import { Button } from './ui/button';

interface QueueItem {
  id: string;
  display_name: string;
  status: 'waiting' | 'approved' | 'rejected' | 'speaking' | 'done';
  created_at: string;
}

interface QueueListProps {
  queue: QueueItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function QueueList({ queue, onApprove, onReject }: QueueListProps) {
  const waitingQueue = queue.filter(item => item.status === 'waiting');
  const approvedQueue = queue.filter(item => item.status === 'approved');
  const speakingItem = queue.find(item => item.status === 'speaking');

  return (
    <div className="glass-card p-6 rounded-2xl w-full max-w-md animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Speaker Queue
      </h3>

      {/* Currently Speaking */}
      {speakingItem && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Now Speaking</p>
          <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-center gap-3 animate-scale-in">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-success" />
            </div>
            <span className="text-foreground font-medium">{speakingItem.display_name}</span>
            <span className="ml-auto text-xs text-success font-medium">LIVE</span>
          </div>
        </div>
      )}

      {/* Approved Queue */}
      {approvedQueue.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Ready to Speak</p>
          <div className="space-y-2">
            {approvedQueue.map((item, index) => (
              <div
                key={item.id}
                className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center gap-3 animate-slide-in-right"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-sm">{item.display_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting Queue */}
      {waitingQueue.length > 0 ? (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Waiting</p>
          <div className="space-y-2">
            {waitingQueue.map((item, index) => (
              <div
                key={item.id}
                className="bg-secondary/50 rounded-xl p-3 flex items-center gap-3 animate-slide-in-right"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>
                <span className="text-foreground text-sm flex-1">{item.display_name}</span>
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => onApprove(item.id)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => onReject(item.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        !speakingItem && approvedQueue.length === 0 && (
          <p className="text-muted-foreground text-sm text-center py-8">
            No one in queue yet. Share the QR code!
          </p>
        )
      )}
    </div>
  );
}
