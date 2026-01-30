import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { useConnection } from './hooks/useConnection';

function App() {
  const { connectionDetails, isLoading, error } = useConnection();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!connectionDetails) {
    return <div>No connection details</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-center py-8">
        🎤 Voice Support Assistant
      </h1>
      
      <LiveKitRoom
        serverUrl={connectionDetails.serverUrl}
        token={connectionDetails.participantToken}
        connect={true}
      >
        <div className="max-w-2xl mx-auto p-4">
          <p className="text-center mb-4">
            Room: {connectionDetails.roomName}
          </p>
          <RoomAudioRenderer />
        </div>
      </LiveKitRoom>
    </div>
  );
}

export default App;