import { useState, useEffect, useCallback } from 'react';
import { Canvas } from './components/Canvas';
import { connectSocket, joinGame, disconnectSocket } from './services/socket';
import { useGameStore } from './store/useGameStore';
import { toggleMute } from './services/webrtc';
import { spatialAudio } from './services/spatialAudio';

function VoiceControls() {
  const muted = useGameStore((s) => s.muted);
  const activeVoiceConnections = useGameStore((s) => s.activeVoiceConnections);
  const nearbyUsers = useGameStore((s) => s.nearbyUsers);
  const masterVolume = useGameStore((s) => s.masterVolume);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    useGameStore.getState().setMasterVolume(volume);
    spatialAudio.setMasterVolume(volume);
  }, []);

  if (nearbyUsers.size === 0 && activeVoiceConnections === 0) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full">
      <button
        onClick={toggleMute}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          muted
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-green-600 hover:bg-green-700'
        }`}
        title={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M12 1a3 3 0 00-3 3v4a3 3 0 006 0V4a3 3 0 00-3-3z" />
          </svg>
        )}
      </button>

      {/* Volume slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={masterVolume}
        onChange={handleVolumeChange}
        className="w-20 h-1 accent-blue-500 cursor-pointer"
        title={`Volume: ${Math.round(masterVolume * 100)}%`}
      />

      <span className="text-white text-sm font-medium">
        {activeVoiceConnections} voice{activeVoiceConnections !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

export function App() {
  const [username, setUsername] = useState('');
  const connected = useGameStore((s) => s.connected);
  const joined = useGameStore((s) => s.joined);

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
      spatialAudio.cleanup();
    };
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (name && connected) {
      // Initialize spatial audio on user gesture (satisfies autoplay policy)
      spatialAudio.initialize();
      await spatialAudio.resume();
      joinGame(name);
    }
  };

  if (!joined) {
    return (
      <div className="w-screen h-screen bg-gray-900 flex items-center justify-center">
        <form onSubmit={handleJoin} className="bg-gray-800 p-8 rounded-lg shadow-lg">
          <h1 className="text-white text-3xl font-bold mb-6 text-center">Talk Space</h1>
          <div className="mb-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              autoFocus
              className="w-full px-4 py-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={!connected || !username.trim()}
            className="w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {connected ? 'Join' : 'Connecting...'}
          </button>
          {!connected && (
            <p className="text-gray-400 text-sm mt-3 text-center">
              Connecting to server...
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen relative">
      <Canvas />
      <VoiceControls />
    </div>
  );
}
