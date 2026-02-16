import { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { GradientBackground } from './GradientBackground';
import { useGameStore } from '../store/useGameStore';
import { connectSocket, joinGame, getSocket } from '../services/socket';
import { logout } from '../services/auth';
import { spatialAudio } from '../services/spatialAudio';

export function Lobby() {
  const authUser = useGameStore((s) => s.authUser);
  const [entering, setEntering] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  // Get online count from server on mount
  useEffect(() => {
    const socket = getSocket();

    const handleOnlineCount = (count: number) => {
      setOnlineCount(count);
    };

    if (socket?.connected) {
      socket.emit('getOnlineCount');
      socket.on('onlineCount', handleOnlineCount);
    }

    return () => {
      if (socket) {
        socket.off('onlineCount', handleOnlineCount);
      }
    };
  }, []);

  const handleEnterSpace = useCallback(async () => {
    setEntering(true);
    try {
      // Initialize spatial audio on user gesture (satisfies autoplay policy)
      spatialAudio.initialize();
      await spatialAudio.resume();

      connectSocket();
      joinGame();
    } catch (err) {
      console.error('Failed to enter space:', err);
      setEntering(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    useGameStore.getState().setAuthUser(null);
  }, []);

  // Get first letter of username for avatar
  const avatarLetter = authUser?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <>
      <GradientBackground />
      <div className="w-screen h-screen flex items-center justify-center">
        <Card variant="glass" padding="lg" className="max-w-sm w-full text-center">
          {/* Gradient Avatar Circle */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center ring-4 ring-primary-500/20">
              <span className="text-white text-3xl font-bold font-heading">
                {avatarLetter}
              </span>
            </div>
          </div>

          {/* Username Display */}
          <p className="text-gray-400 text-sm mb-1">Welcome back,</p>
          <h2 className="text-white text-xl font-heading font-semibold mb-2">
            {authUser?.username}
          </h2>

          {/* Tagline */}
          <p className="text-gray-500 text-sm italic mb-4">Ready to explore?</p>

          {/* Live Online Count Badge */}
          <div className="flex justify-center mb-6">
            <Badge variant="voice" pulse>
              {onlineCount !== null ? `${onlineCount} online` : '-- online'}
            </Badge>
          </div>

          {/* Enter Space Button */}
          <Button
            className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 hover:scale-[1.02] hover:shadow-glow-md shadow-primary-500/25 py-3 text-lg"
            onClick={handleEnterSpace}
            loading={entering}
            size="lg"
          >
            {entering ? 'Entering...' : 'Enter Space'}
          </Button>

          {/* Logout Link */}
          <button
            onClick={handleLogout}
            className="mt-4 text-gray-500 text-sm hover:text-white transition-colors cursor-pointer"
          >
            Logout
          </button>
        </Card>
      </div>
    </>
  );
}
