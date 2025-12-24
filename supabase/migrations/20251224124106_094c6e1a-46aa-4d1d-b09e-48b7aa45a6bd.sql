-- Create rooms table to manage host sessions
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create queue table for people waiting to speak
CREATE TABLE public.speaker_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'approved', 'rejected', 'speaking', 'done')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, session_id)
);

-- Enable Row Level Security (public access since no auth required)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speaker_queue ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read rooms
CREATE POLICY "Anyone can read rooms" 
ON public.rooms 
FOR SELECT 
USING (true);

-- Allow anyone to create a room (become host)
CREATE POLICY "Anyone can create room" 
ON public.rooms 
FOR INSERT 
WITH CHECK (true);

-- Allow host to update their room
CREATE POLICY "Host can update room" 
ON public.rooms 
FOR UPDATE 
USING (true);

-- Allow host to delete their room
CREATE POLICY "Host can delete room" 
ON public.rooms 
FOR DELETE 
USING (true);

-- Allow anyone to read queue
CREATE POLICY "Anyone can read queue" 
ON public.speaker_queue 
FOR SELECT 
USING (true);

-- Allow anyone to join queue
CREATE POLICY "Anyone can join queue" 
ON public.speaker_queue 
FOR INSERT 
WITH CHECK (true);

-- Allow updates to queue (for status changes)
CREATE POLICY "Anyone can update queue" 
ON public.speaker_queue 
FOR UPDATE 
USING (true);

-- Allow deletes from queue
CREATE POLICY "Anyone can delete from queue" 
ON public.speaker_queue 
FOR DELETE 
USING (true);

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.speaker_queue;