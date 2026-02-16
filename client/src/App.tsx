import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from './components/Canvas';
import { AuthForms } from './components/AuthForms';
import { Lobby } from './components/Lobby';
import { Card } from './components/ui/Card';
import { ToastProvider } from './components/ui/Toast';
import { GradientBackground } from './components/GradientBackground';
import { disconnectSocket } from './services/socket';
import { fetchProfile } from './services/auth';
import { useGameStore } from './store/useGameStore';
import { toggleMute } from './services/webrtc';
import { spatialAudio } from './services/spatialAudio';
import { fadeScaleVariants, zoomInVariants } from './animations/transitions';

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

function SessionSkeleton() {
  return (
    <>
      <GradientBackground />
      <div className="w-screen h-screen flex items-center justify-center">
        <Card variant="glass" padding="lg" className="max-w-sm w-full">
          <div className="flex flex-col items-center space-y-4">
            {/* Avatar skeleton */}
            <div className="w-16 h-16 rounded-full bg-surface-700 animate-pulse" />

            {/* Username skeleton */}
            <div className="w-32 h-4 bg-surface-700 animate-pulse rounded" />

            {/* Button skeletons */}
            <div className="w-full h-10 bg-surface-700 animate-pulse rounded-lg" />
            <div className="w-full h-10 bg-surface-700 animate-pulse rounded-lg" />
          </div>
        </Card>
      </div>
    </>
  );
}

export function App() {
  const isAuthenticated = useGameStore((s) => s.isAuthenticated);
  const joined = useGameStore((s) => s.joined);
  const [restoring, setRestoring] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Minimum skeleton display time (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Auto-restore session from stored tokens on mount
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const user = await fetchProfile();
        if (!cancelled && user) {
          useGameStore.getState().setAuthUser(user);
        }
      } catch {
        // No valid session — show login
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
      spatialAudio.cleanup();
    };
  }, []);

  const showSkeleton = restoring || !minTimeElapsed;

  // Determine current page key for AnimatePresence
  const pageKey = showSkeleton ? 'skeleton' : !isAuthenticated ? 'auth' : !joined ? 'lobby' : 'game';

  return (
    <>
      <ToastProvider />
      <AnimatePresence mode="wait">
        {pageKey === 'skeleton' && (
          <motion.div
            key="skeleton"
            variants={fadeScaleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-screen h-screen"
          >
            <SessionSkeleton />
          </motion.div>
        )}
        {pageKey === 'auth' && (
          <motion.div
            key="auth"
            variants={fadeScaleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-screen h-screen"
          >
            <AuthForms />
          </motion.div>
        )}
        {pageKey === 'lobby' && (
          <motion.div
            key="lobby"
            variants={fadeScaleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-screen h-screen"
          >
            <Lobby />
          </motion.div>
        )}
        {pageKey === 'game' && (
          <motion.div
            key="game"
            variants={zoomInVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-screen h-screen relative"
          >
            <Canvas />
            <VoiceControls />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
