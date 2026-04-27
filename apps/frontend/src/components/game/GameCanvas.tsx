import { useEffect } from 'react';
import PhaserGame from './PhaserGame';
import GameHUD from './GameHUD';
import { wsClient } from '../../lib/wsClient';
import { useGameUIStore } from '../../lib/store';

export default function GameCanvas() {
  const setConnected = useGameUIStore((state) => state.setConnected);

  useEffect(() => {
    // Connect to WebSocket when canvas mounts
    // wsClient.connect('wss://mock-server.com');                   // maybe update the protocol later to wss (secure) from ws
    wsClient.connect('ws://localhost:3001');

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    wsClient.on('connect', handleConnect);
    wsClient.on('disconnect', handleDisconnect);

    return () => {
      wsClient.off('connect', handleConnect);
      wsClient.off('disconnect', handleDisconnect);
      wsClient.disconnect();
    };
  }, [setConnected]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <PhaserGame />
      <GameHUD />
    </div>
  );
}
