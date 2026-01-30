import { useState, useEffect } from 'react';

interface ConnectionDetails {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';


export function useConnection(agentName?: string) {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConnectionDetails() {
      try {
        console.log('🔵 Fetching connection details from backend...');

        const response = await fetch(`${BACKEND_URL}/api/connection-details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            room_config: agentName ? {
              agents: [{ agent_name: agentName }]
            } : undefined
          }),
        });

        console.log('🔵 Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response error:', errorText);
          throw new Error(`Server returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Connection details received:', data);
        setConnectionDetails(data);
      } catch (err) {
        console.error('❌ Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchConnectionDetails();
  }, [agentName]);

  return { connectionDetails, isLoading, error };
}
