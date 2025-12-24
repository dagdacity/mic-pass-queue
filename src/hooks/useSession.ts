import { useState, useEffect } from 'react';

export function useSession() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('mic-session-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('mic-session-id', id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
