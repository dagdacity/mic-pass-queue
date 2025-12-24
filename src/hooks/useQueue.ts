import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './useSession';
import { useToast } from './use-toast';

interface QueueItem {
  id: string;
  room_id: string;
  session_id: string;
  display_name: string;
  status: 'waiting' | 'approved' | 'rejected' | 'speaking' | 'done';
  created_at: string;
  approved_at: string | null;
}

export function useQueue(roomId: string | null) {
  const sessionId = useSession();
  const { toast } = useToast();
  const [myQueueItem, setMyQueueItem] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch my queue item
  const fetchMyQueueItem = useCallback(async () => {
    if (!roomId || !sessionId) return;

    const { data, error } = await supabase
      .from('speaker_queue')
      .select('*')
      .eq('room_id', roomId)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching queue item:', error);
      return;
    }

    setMyQueueItem(data as QueueItem | null);
  }, [roomId, sessionId]);

  // Join queue
  const joinQueue = async (displayName: string) => {
    if (!roomId || !sessionId) return;

    const { data, error } = await supabase
      .from('speaker_queue')
      .insert({
        room_id: roomId,
        session_id: sessionId,
        display_name: displayName,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already in queue",
          description: "You're already in the queue.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to join queue.",
          variant: "destructive",
        });
      }
      return;
    }

    setMyQueueItem(data as QueueItem);
    toast({
      title: "Joined queue",
      description: "Waiting for host approval...",
    });
  };

  // Leave queue
  const leaveQueue = async () => {
    if (!myQueueItem) return;

    const { error } = await supabase
      .from('speaker_queue')
      .delete()
      .eq('id', myQueueItem.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to leave queue.",
        variant: "destructive",
      });
      return;
    }

    setMyQueueItem(null);
    toast({
      title: "Left queue",
      description: "You've left the queue.",
    });
  };

  // Update status to speaking
  const startSpeaking = async () => {
    if (!myQueueItem) return;

    const { error } = await supabase
      .from('speaker_queue')
      .update({ status: 'speaking' })
      .eq('id', myQueueItem.id);

    if (error) {
      console.error('Error starting speaking:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (roomId && sessionId) {
      fetchMyQueueItem().then(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [roomId, sessionId, fetchMyQueueItem]);

  // Subscribe to realtime updates for my queue item
  useEffect(() => {
    if (!roomId || !sessionId) return;

    const channel = supabase
      .channel('my-queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'speaker_queue',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchMyQueueItem();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, sessionId, fetchMyQueueItem]);

  return {
    myQueueItem,
    loading,
    joinQueue,
    leaveQueue,
    startSpeaking,
  };
}
