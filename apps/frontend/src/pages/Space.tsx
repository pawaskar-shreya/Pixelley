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

    // Fetch available elements
    api.getElements()
      .then(res => setElements(res.elements || []))
      .catch(console.error);

    // Connect to WebSocket
    wsClient.connect('wss://mock-server.com');
    wsClient.sendEvent('joinSpace', { spaceId });

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

  if (!spaceData) return <div className="p-8 text-white bg-black h-screen">Loading space...</div>;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex">
      <div className="flex-1 relative">
        <PhaserGame spaceData={spaceData} />
        <GameHUD onToggleElements={() => setShowElementsPanel(!showElementsPanel)} />
      </div>
      
      {showElementsPanel && (
        <div className="w-80 bg-white h-full shadow-xl flex flex-col z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg">Elements</h2>
            <button onClick={() => setShowElementsPanel(false)} className="text-gray-500 hover:text-black">✕</button>
          </div>
          <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 gap-4">
            {elements.map(el => (
              <div 
                key={el.id} 
                className="border rounded p-2 cursor-pointer hover:border-blue-500 flex flex-col items-center"
                onClick={() => handleAddElement(el.id)}
              >
                <img src={el.imageUrl} alt={el.id} className="w-16 h-16 object-contain mb-2" />
                <span className="text-xs text-center text-gray-600 truncate w-full">{el.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
