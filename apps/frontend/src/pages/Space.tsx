import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PhaserGame from '../components/game/PhaserGame';
import GameHUD from '../components/game/GameHUD';
import { wsClient } from '../lib/wsClient';
import { useGameUIStore, useAuthStore } from '../lib/store';
import { api } from '../lib/api';
import { Element, SpaceData } from '../lib/types';

export default function Space() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const setConnected = useGameUIStore((state) => state.setConnected);
  const connected = useGameUIStore((state) => state.connected);
  const [spaceData, setSpaceData] = useState<SpaceData | null>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [showElementsPanel, setShowElementsPanel] = useState(false);
  const draggingElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!spaceId) return;

    api.getSpace(spaceId)
      .then(res => setSpaceData(res))
      .catch(err => {
        console.error(err);
        navigate('/dashboard');
      });

    api.getElements(spaceId)
      .then(res => setElements(res.elements || []))
      .catch(console.error);

      setConnected(false);
      wsClient.connect('ws://localhost:3001', spaceId);             // Connect to WebSocket BEFORE mounting Phaser

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

  const handleDragStart = (el: Element) => {
    draggingElement.current = el;
  };

  // Converting the screen-space drop point to Phaser world coordinates, accounting for the camera's current scroll position.
  const screenToWorld = (screenX: number, screenY: number) => {
    const game = (window as any).__phaserGame as Phaser.Game | undefined;
    if (!game) return { x: screenX, y: screenY };

    const scene = game.scene.getScene('GameScene') as any;
    if (!scene?.cameras?.main) return { x: screenX, y: screenY };

    const cam = scene.cameras.main as Phaser.Cameras.Scene2D.Camera;
    const canvas = game.canvas;
    const rect = canvas.getBoundingClientRect();

    // drop coords relative to canvas top-left
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    // scale in case the canvas CSS size != its pixel size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const worldX = (canvasX * scaleX) + cam.scrollX;
    const worldY = (canvasY * scaleY) + cam.scrollY;

    return { x: Math.round(worldX), y: Math.round(worldY) };
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // required to allow drop
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = draggingElement.current;
    if (!el || !spaceId) return;

    const { x, y } = screenToWorld(e.clientX, e.clientY);
    console.log('[Space] Drop at world', { x, y }, 'element', el.id);

    try {
      const res = await api.addElementToSpace({ elementId: el.id, spaceId, x, y });

      // Dispatch to Phaser by carrying the full element definition so GameScene can build the SpaceElement object without an extra API call.
      const { user } = useAuthStore.getState();

      const spaceElementPayload = {
        id: res.id,
        element: el,
        x,
        y,
        addedById: user?.id,
      };

      window.dispatchEvent(new CustomEvent('add-element', {
        detail: spaceElementPayload,
      }));

      // Broadcast to other users via WS
      wsClient.sendElementAdded(spaceElementPayload);
    } catch (err) {
      console.error('[Space] Failed to add element:', err);
    }
    draggingElement.current = null;
  };

  if (!spaceData) return <div>Loading space...</div>;
  if (!connected) return <div>Connecting to realtime server...</div>;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: 'black' }}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop} >
      <PhaserGame spaceData={spaceData} spaceId={spaceId} />

      <GameHUD onToggleElements={() => setShowElementsPanel(!showElementsPanel)} />

      {showElementsPanel && (
        <div style={{ pointerEvents: 'auto' }}
          className="absolute right-0 top-1/2 -translate-y-1/2
            w-80 h-[70%]
            bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl
            flex flex-col z-50" >
          <div className="p-3 border-b border-white/20 flex justify-between items-center text-white">
            <h2 className="font-bold text-lg">Elements</h2>
            <span className="text-xs text-white/50 mr-auto ml-2">drag onto canvas</span>
            <button onClick={() => setShowElementsPanel(false)} className="hover:text-red-400">✕</button>
          </div>

          <div className="p-3 overflow-y-auto flex-1 grid grid-cols-2 gap-3">
            {elements.map(el => (
              <div
                key={el.id}
                draggable
                onDragStart={() => handleDragStart(el)}
                className="
                  border border-white/20
                  rounded
                  p-2
                  cursor-pointer
                  hover:border-blue-400
                  flex flex-col items-center text-white select-none"
              >
                <img src={el.imageUrl} alt={el.name} className="w-16 h-16 object-contain mb-2 pointer-events-none" />
                <span className="text-xs text-center truncate w-full">{el.name}</span>
                {el.isCollidable && (
                  <span className="text-[10px] text-yellow-400 mt-1">⚠ collidable</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
