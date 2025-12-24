import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './useSession';
import { useToast } from './use-toast';

interface Room {
  id: string;
  host_session_id: string;
  is_active: boolean;
  created_at: string;
}

interface QueueItem {
  id: string;
  room_id: string;
  session_id: string;
  display_name: string;
  status: 'waiting' | 'approved' | 'rejected' | 'speaking' | 'done';
  created_at: string;
  approved_at: string | null;
}

export function useRoom() {
  const sessionId = useSession();
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch active room
  const fetchRoom = useCallback(async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching room:', error);
      return;
    }

    setRoom(data);
    if (data && sessionId) {
      setIsHost(data.host_session_id === sessionId);
    }
  }, [sessionId]);

  // Fetch queue for room
  const fetchQueue = useCallback(async () => {
    if (!room) return;

    const { data, error } = await supabase
      .from('speaker_queue')
      .select('*')
      .eq('room_id', room.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching queue:', error);
      return;
    }

    setQueue((data || []) as QueueItem[]);
  }, [room]);

  // Become host
  const becomeHost = async () => {
    if (!sessionId) return;

    // First, deactivate any existing rooms
    await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('rooms')
      .insert({ host_session_id: sessionId })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to become host. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setRoom(data);
    setIsHost(true);
    toast({
      title: "You're the host!",
      description: "Share the QR code to let others join.",
    });
  };

  // Leave host
  const leaveHost = async () => {
    if (!room || !isHost) return;

    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', room.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to leave host. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setRoom(null);
    setIsHost(false);
    setQueue([]);
    toast({
      title: "Left host",
      description: "You are no longer the host.",
    });
  };

  // Approve speaker
  const approveSpeaker = async (queueItemId: string) => {
    // First set any currently speaking to done
    await supabase
      .from('speaker_queue')
      .update({ status: 'done' })
      .eq('room_id', room?.id)
      .eq('status', 'speaking');

    const { error } = await supabase
      .from('speaker_queue')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', queueItemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to approve speaker.",
        variant: "destructive",
      });
    }
  };

  // Reject speaker
  const rejectSpeaker = async (queueItemId: string) => {
    const { error } = await supabase
      .from('speaker_queue')
      .update({ status: 'rejected' })
      .eq('id', queueItemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject speaker.",
        variant: "destructive",
      });
    }
  };

  // Set speaker to speaking
  const setSpeaking = async (queueItemId: string) => {
    const { error } = await supabase
      .from('speaker_queue')
      .update({ status: 'speaking' })
      .eq('id', queueItemId);

    if (error) {
      console.error('Error setting speaking:', error);
    }
  };

  // End speaker turn
  const endSpeakerTurn = async (queueItemId: string) => {
    const { error } = await supabase
      .from('speaker_queue')
      .update({ status: 'done' })
      .eq('id', queueItemId);

    if (error) {
      console.error('Error ending turn:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (sessionId) {
      fetchRoom().then(() => setLoading(false));
    }
  }, [sessionId, fetchRoom]);

  // Fetch queue when room changes
  useEffect(() => {
    if (room) {
      fetchQueue();
    }
  }, [room, fetchQueue]);

  // Subscribe to realtime updates
  useEffect(() => {
    const roomChannel = supabase
      .channel('rooms-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => {
          fetchRoom();
        }
      )
      .subscribe();

    const queueChannel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'speaker_queue' },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(queueChannel);
    };
  }, [fetchRoom, fetchQueue]);

  return {
    sessionId,
    room,
    queue,
    isHost,
    loading,
    becomeHost,
    leaveHost,
    approveSpeaker,
    rejectSpeaker,
    setSpeaking,
    endSpeakerTurn,
  };
}
