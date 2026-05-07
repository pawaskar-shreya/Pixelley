import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PhaserGame from '../components/game/PhaserGame';
import GameHUD from '../components/game/GameHUD';
import { wsClient } from '../lib/wsClient';
import { useGameUIStore, useAuthStore } from '../lib/store';
import { api } from '../lib/api';
import { Element, SpaceData } from '../lib/types';

// Kawaii design tokens
const HUD_BG = '#fffdf7';
const HUD_BORDER = '#1f1f1f';
const HUD_SHADOW = '4px 4px 0px #1f1f1f';
const HUD_FONT = "'Nunito', sans-serif";
const HUD_HEADING = "'Baloo 2', sans-serif";
const PINK_BG = '#FFD6EA';

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

  const handleDragStart = (el: Element) => {
    draggingElement.current = el;
  };

  const screenToWorld = (screenX: number, screenY: number) => {
    const game = (window as any).__phaserGame as Phaser.Game | undefined;
    if (!game) return { x: screenX, y: screenY };
    const scene = game.scene.getScene('GameScene') as any;
    if (!scene?.cameras?.main) return { x: screenX, y: screenY };
    const cam = scene.cameras.main as Phaser.Cameras.Scene2D.Camera;
    const canvas = game.canvas;
    const rect = canvas.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: Math.round((canvasX * scaleX) + cam.scrollX), y: Math.round((canvasY * scaleY) + cam.scrollY) };
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const el = draggingElement.current;
    if (!el || !spaceId) return;
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    try {
      const res = await api.addElementToSpace({ elementId: el.id, spaceId, x, y });
      const { user } = useAuthStore.getState();
      const spaceElementPayload = { id: res.id, element: el, x, y, addedById: user?.id };
      window.dispatchEvent(new CustomEvent('add-element', { detail: spaceElementPayload }));
      wsClient.sendElementAdded(spaceElementPayload);
    } catch (err) {
      console.error('[Space] Failed to add element:', err);
    }
    draggingElement.current = null;
  };

  //  Loading / Connecting states 
  if (!spaceData || !connected) {
    const msg = !spaceData ? '🗺️ Loading space...' : '🔌 Connecting to server...';
    const emoji = !spaceData ? '🎮' : '🌸';
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: HUD_BG,
            border: `3px solid ${HUD_BORDER}`,
            borderRadius: '24px',
            boxShadow: '5px 5px 0px #1f1f1f',
            padding: '40px 56px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>{emoji}</div>
          <p style={{ fontFamily: HUD_HEADING, fontWeight: 700, fontSize: '18px', color: '#333', margin: 0 }}>
            {msg}
          </p>
        </div>
      </div>
    );
  }

  // Main game view 
  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#c9e8f5' }}
      onDragOver={handleCanvasDragOver}
      onDrop={handleCanvasDrop}
    >
      <PhaserGame spaceData={spaceData} spaceId={spaceId} />

      <GameHUD onToggleElements={() => setShowElementsPanel(!showElementsPanel)} />

      {/* Elements Panel */}
      {showElementsPanel && (
        <div
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '280px',
            height: '70%',
            background: HUD_BG,
            border: `3px solid ${HUD_BORDER}`,
            borderRadius: '20px',
            boxShadow: HUD_SHADOW,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
            overflow: 'hidden',
            pointerEvents: 'auto',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `2.5px solid ${HUD_BORDER}`,
              background: PINK_BG,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <h2 style={{ fontFamily: HUD_HEADING, fontWeight: 800, fontSize: '16px', color: '#1f1f1f', margin: 0 }}>
                🧩 Elements
              </h2>
              <span style={{ fontFamily: HUD_FONT, fontSize: '13px', color: '#444', fontWeight: 700 }}>
                drag onto canvas
              </span>
            </div>
            <button
              id="elements-panel-close"
              onClick={() => setShowElementsPanel(false)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                border: `2px solid ${HUD_BORDER}`,
                background: '#ffe4f3',
                boxShadow: '2px 2px 0px #1f1f1f',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '14px',
                color: '#1f1f1f',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Element grid */}
          <div
            style={{
              padding: '12px',
              overflowY: 'auto',
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#ffb3d6 #fff0f7',
            }}
          >
            {elements.length === 0 && (
              <p
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  fontFamily: HUD_FONT,
                  color: '#555',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginTop: '20px',
                }}
              >
                No elements yet 🌟
              </p>
            )}
            {elements.map(el => (
              <div
                key={el.id}
                draggable
                onDragStart={() => handleDragStart(el)}
                style={{
                  background: '#fff',
                  border: `2px solid ${HUD_BORDER}`,
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0px #1f1f1f',
                  padding: '10px 8px',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  userSelect: 'none',
                  transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translate(-1px,-1px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '4px 4px 0px #1f1f1f';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'none';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '3px 3px 0px #1f1f1f';
                }}
              >
                <img
                  src={el.imageUrl}
                  alt={el.name}
                  style={{ width: '52px', height: '52px', objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none' }}
                />
                <span
                  style={{
                    fontFamily: HUD_FONT,
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#1f1f1f',
                    textAlign: 'center',
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {el.name}
                </span>
                {el.isCollidable && (
                  <span
                    style={{
                      fontFamily: HUD_FONT,
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#1f1f1f',
                      background: '#ffe066',
                      border: `1.5px solid ${HUD_BORDER}`,
                      borderRadius: '99px',
                      padding: '2px 8px',
                    }}
                  >
                    ⚠ Collidable
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
