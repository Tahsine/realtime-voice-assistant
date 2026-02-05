import '@livekit/components-styles';
import { LiveKitRoom, RoomAudioRenderer, useVoiceAssistant, ControlBar, useConnectionState } from '@livekit/components-react';
import { ConnectionState as RoomConnectionState } from 'livekit-client';
import { useConnection } from './hooks/useConnection';
import { AgentAudioVisualizerBar } from './components/agents-ui/agent-audio-visualizer-bar';
import { LucideWifi, LucideWifiOff, LucideLoader2, LucideGithub, LucidePlay, LucideAlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

function AgentVisualizer() {
  const { audioTrack, state } = useVoiceAssistant();

  return (
    <div className="flex justify-center items-center flex-1 w-full h-full">
      <div className="relative">
        <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
        <AgentAudioVisualizerBar
          size="lg"
          barCount={7}
          state={state}
          audioTrack={audioTrack}
        />
      </div>
    </div>
  );
}

function StatusIndicator() {
  const state = useConnectionState();

  const getStatusInfo = (state: RoomConnectionState) => {
    switch (state) {
      case RoomConnectionState.Connected:
        return { color: 'bg-green-500', text: 'Online', icon: <LucideWifi className="w-3 h-3" /> };
      case RoomConnectionState.Connecting:
        return { color: 'bg-yellow-500', text: 'Connecting', icon: <LucideLoader2 className="w-3 h-3 animate-spin" /> };
      case RoomConnectionState.Disconnected:
        return { color: 'bg-red-500', text: 'Offline', icon: <LucideWifiOff className="w-3 h-3" /> };
      case RoomConnectionState.Reconnecting:
        return { color: 'bg-orange-500', text: 'Reconnecting', icon: <LucideLoader2 className="w-3 h-3 animate-spin" /> };
      default:
        return { color: 'bg-gray-500', text: 'Unknown', icon: <LucideWifiOff className="w-3 h-3" /> };
    }
  };

  const info = getStatusInfo(state);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-300`}>
      <span className={`relative flex h-2 w-2`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${info.color}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${info.color}`}></span>
      </span>
      <span className="text-xs font-medium tracking-wide text-white/90 uppercase">{info.text}</span>
    </div>
  );
}

function DisconnectObserver({ onDisconnect }: { onDisconnect: () => void }) {
  const state = useConnectionState();
  useEffect(() => {
    if (state === RoomConnectionState.Disconnected) {
      onDisconnect();
    }
  }, [state, onDisconnect]);
  return null;
}

function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full z-10 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in duration-500">

        {/* Logo and Title */}
        <div className="space-y-4 flex flex-col items-center">
          <img src="/logo.svg" alt="IRIS Logo" className="w-20 h-20 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-sm">
              IRIS
            </h1>
            <p className="text-sm tracking-[0.3em] text-blue-500/80 font-medium uppercase text-center">
              Visual Intelligence
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-4 text-gray-400 text-sm leading-relaxed px-4">
          <p>
            Experience the future of multimodal AI. IRIS uses
            <span className="text-blue-400 font-semibold mx-1">Gemini 3 Flash</span>
            to see, hear, and understand your world in real-time.
          </p>
        </div>

        {/* Start Button */}
        <button
          onClick={onStart}
          className="group relative px-8 py-4 bg-white text-black font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center gap-3 cursor-pointer"
        >
          <LucidePlay className="w-5 h-5 fill-current" />
          <span>Start Experience</span>
          <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 transition-all" />
        </button>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-4 w-full pt-8">
          {/* API Limit Warning */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3 text-left">
            <LucideAlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-white/90 uppercase tracking-wide">Free Tier Preview</h3>
              <p className="text-xs text-gray-500">
                This demo runs on a free API tier. You may experience rate limits or stability issues during high traffic.
              </p>
            </div>
          </div>

          {/* GitHub Link */}
          <a
            href="https://github.com/Tahsine/realtime-voice-assistant"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3 text-left hover:bg-white/10 transition-colors cursor-pointer"
          >
            <LucideGithub className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-white/90 uppercase tracking-wide">Open Source</h3>
              <p className="text-xs text-gray-500">
                Deploy your own instance with your API keys for unlimited access.
              </p>
            </div>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-[10px] text-gray-600 uppercase tracking-widest">
        Powered by LiveKit & Google Gemini
      </div>
    </div>
  );
}

function App() {
  const { connectionDetails, isLoading, error } = useConnection();
  const [isChatStarted, setIsChatStarted] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <div className="flex flex-col items-center gap-4">
          <LucideLoader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-400">Initializing IRIS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-red-500">Error: {error}</div>;
  }

  if (!connectionDetails) {
    return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-gray-500">No connection details</div>;
  }

  if (!isChatStarted) {
    return <WelcomeScreen onStart={() => setIsChatStarted(true)} />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-white overflow-hidden selection:bg-blue-500/30">
      <LiveKitRoom
        serverUrl={connectionDetails.serverUrl}
        token={connectionDetails.participantToken}
        connect={true}
        audio={true}
        video={false}
        data-lk-theme="default"
        className="flex flex-col h-full w-full"
      >
        {/* Header - Transparent & Floating */}
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="IRIS Logo" className="w-10 h-10 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" />
            <div className="flex flex-col">
              <h1 className="text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-sm">
                IRIS
              </h1>
              <span className="text-[10px] tracking-[0.2em] text-blue-500/60 font-medium uppercase mt-0.5">
                Visual Intelligence
              </span>
            </div>
          </div>
          <StatusIndicator />
        </header>

        {/* Main Content - Centered */}
        <main className="flex-1 flex flex-col items-center justify-center relative z-0">
          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
          <AgentVisualizer />
        </main>

        {/* Footer - Controls */}
        <footer className="absolute bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <div className="pointer-events-auto bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-2 shadow-2xl hover:bg-black/50 transition-colors duration-300">
            <ControlBar
              saveUserChoices={true}
              variation='minimal'
              controls={{ chat: false, screenShare: true, camera: false, microphone: true, leave: true, settings: false }} // Explicit controls
            />
          </div>
        </footer>

        <DisconnectObserver onDisconnect={() => setIsChatStarted(false)} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

export default App;