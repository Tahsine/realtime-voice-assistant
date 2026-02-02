import '@livekit/components-styles';
import { ConnectionState, LiveKitRoom, RoomAudioRenderer, useVoiceAssistant, ControlBar, Chat } from '@livekit/components-react';
import { useConnection } from './hooks/useConnection';
import { AgentAudioVisualizerBar } from './components/agents-ui/agent-audio-visualizer-bar';

function AgentVisualizer() {
  const { audioTrack, state } = useVoiceAssistant();

  return (
    <div className="flex justify-center py-6">
      <AgentAudioVisualizerBar
        size="lg"
        barCount={5}
        state={state}
        audioTrack={audioTrack}
      />
    </div>
  );
}

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
    <div className="min-h-screen text-white">
      <h1 className="text-3xl font-bold text-center py-8">
        Voice Support Assistant
      </h1>
      
      <LiveKitRoom
        serverUrl={connectionDetails.serverUrl}
        token={connectionDetails.participantToken}
        connect={false}
        audio={true}
        video={false}
        data-lk-theme="default"
      >
        <ConnectionState />
        <RoomAudioRenderer />

        <AgentVisualizer />
        
        <Chat/>
        <ControlBar saveUserChoices={true} variation='minimal'/>
      </LiveKitRoom>
    </div>
  );
}

export default App;