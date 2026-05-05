import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PhaserGame from '../components/game/PhaserGame';
import GameHUD from '../components/game/GameHUD';
import { wsClient } from '../lib/wsClient';
import { useGameUIStore } from '../lib/store';
import { api } from '../lib/api';
import { Element, SpaceData } from '../lib/types';

export default function Space() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const setConnected = useGameUIStore((state) => state.setConnected);
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [showElementsPanel, setShowElementsPanel] = useState(false);

  useEffect(() => {
    if (!spaceId) return;

    // Fetch space data
    api.getSpace(spaceId)
      .then(res => setSpaceData(res))
      .catch(err => {
        console.error(err);
        navigate('/dashboard');
      });

    // Fetch available elements to be added by user
    api.getElements(spaceId)
      .then(res => setElements(res.elements || []))
      .catch(console.error);

    // Connect to WebSocket
    wsClient.connect('ws://localhost:3001', spaceId);

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    wsClient.on('connect', handleConnect);
    wsClient.on('disconnect', handleDisconnect);

    return () => {
      wsClient.off('connect', handleConnect);
      wsClient.off('disconnect', handleDisconnect);
      wsClient.disconnect();
    };
  }, [spaceId, navigate, setConnected]);

  const handleAddElement = async (elementId: string) => {
    if (!spaceId) return;
    try {
      // Add element at center of screen (mock coordinates)
      const res = await api.addElementToSpace({
        elementId,
        spaceId,
        x: 400,
        y: 300
      });
      
      // Tell Phaser to add it
      window.dispatchEvent(new CustomEvent('add-element', { 
        detail: { id: res.id || Math.random().toString(), elementId, x: 400, y: 300 } 
      }));
    } catch (err) {
      console.error(err);
    }
  };

  if (!spaceData) return <div>Loading space...</div>;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'black',
      }} >
      <PhaserGame spaceData={spaceData} spaceId={spaceId} />

      <GameHUD onToggleElements={() => setShowElementsPanel(!showElementsPanel)} />

      {showElementsPanel && (
        <div
          className="
            absolute
            right-0
            top-1/2
            -translate-y-1/2
            w-80
            h-[70%]
            bg-white/10
            backdrop-blur-sm
            border border-white/20
            shadow-xl
            flex flex-col
            z-50
          "
        >
          <div className="p-3 border-b border-white/20 flex justify-between items-center text-white">
            <h2 className="font-bold text-lg">Elements</h2>
            <button
              onClick={() => setShowElementsPanel(false)}
              className="hover:text-red-400"
            >
              ✕
            </button>
          </div>

          <div className="p-3 overflow-y-auto flex-1 grid grid-cols-2 gap-3">
            {elements.map(el => (
              <div
                key={el.id}
                className="
                  border border-white/20
                  rounded
                  p-2
                  cursor-pointer
                  hover:border-blue-400
                  flex flex-col items-center
                  text-white
                "
                onClick={() => handleAddElement(el.id)}
              >
                <img
                  src={el.imageUrl}
                  alt={el.id}
                  className="w-16 h-16 object-contain mb-2"
                />
                <span className="text-xs text-center truncate w-full">
                  {el.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
