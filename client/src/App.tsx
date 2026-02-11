import { useState, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { connectSocket, joinGame, disconnectSocket } from './services/socket';
import { useGameStore } from './store/useGameStore';

export function App() {
  const [username, setUsername] = useState('');
  const connected = useGameStore((s) => s.connected);
  const joined = useGameStore((s) => s.joined);

  useEffect(() => {
    connectSocket();
    return () => disconnectSocket();
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (name && connected) {
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

  return <Canvas />;
}
