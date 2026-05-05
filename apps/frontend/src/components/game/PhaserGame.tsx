import { useEffect, useRef } from 'react';
import { getPhaserConfig } from '../../game/config/phaserConfig';
import { SpaceData } from '../../lib/types';
import { api } from '../../lib/api';

interface PhaserGameProps {
  spaceData?: SpaceData;
  spaceId?: string;
}

export default function PhaserGame({ spaceData, spaceId }: PhaserGameProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' && !gameContainerRef.current && gameRef.current) return;
    
    // Ensure the container has dimensions before initializing
    const initGame = () => {
      if (!gameContainerRef.current) return;
      const width = gameContainerRef.current.clientWidth;
      const height = gameContainerRef.current.clientHeight;
      
      if (width === 0 || height === 0) {
        requestAnimationFrame(initGame);
        return;
      }

      api.getAvatars().then(({ avatars }) => {
        import('phaser').then((Phaser) => {
          const config = getPhaserConfig(gameContainerRef.current!);
          gameRef.current = new Phaser.default.Game(config);

          // Make canvas focusable so keyboard events (arrow keys, WASD) are captured
          gameRef.current.canvas.setAttribute('tabindex', '0');
          gameRef.current.canvas.style.outline = 'none';
          gameRef.current.canvas.focus();

          // Avatar R2 URLs: PreloadScene reads this
          gameRef.current.registry.set('avatars', avatars);
          
          // Pass spaceData to the game registry so scenes can access it
          if (spaceData) {
            gameRef.current.registry.set('spaceData', spaceData);
          }
          if (spaceId) {
            gameRef.current.registry.set('spaceId', spaceId);
          }

          // Bridge: makes the game instance accessible to React (eg, Dashboard)
          (window as any).__phaserGame = gameRef.current;
          gameRef.current = gameRef.current;

          // Keep Phaser sized exactly to the container (eg, when layout widths change)
          const el = gameContainerRef.current!;
          const ro = new ResizeObserver(() => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            if (!w || !h || !gameRef.current) return;
            gameRef.current.scale.resize(w, h);
          });
          ro.observe(el);
          (gameRef.current as any).__resizeObserver = ro;
        });
      }).catch(err => {
      console.error('[PhaserGame] Failed to fetch avatars:', err);
      // Boot anyway with empty avatars so game isn't fully broken
      import('phaser').then((Phaser) => {
        const config = getPhaserConfig(gameContainerRef.current!);
        const game   = new Phaser.default.Game(config);

        // Make canvas focusable so keyboard events are captured
        game.canvas.setAttribute('tabindex', '0');
        game.canvas.style.outline = 'none';
        game.canvas.focus();

        game.registry.set('avatars', []);
        if (spaceData) game.registry.set('spaceData', spaceData);
        if (spaceId)   game.registry.set('spaceId',   spaceId);
        (window as any).__phaserGame = game;
        gameRef.current = game;

        const el = gameContainerRef.current!;
        const ro = new ResizeObserver(() => {
          const w = el.clientWidth;
          const h = el.clientHeight;
          if (!w || !h || !gameRef.current) return;
          gameRef.current.scale.resize(w, h);
        });
        ro.observe(el);
        (gameRef.current as any).__resizeObserver = ro;
      });
    });
    };

    initGame();
    

    return () => {
      if (gameRef.current) {
        const ro = (gameRef.current as any).__resizeObserver as ResizeObserver | undefined;
        ro?.disconnect();
        gameRef.current.destroy(true);
        delete (window as any).__phaserGame;          // clean up bridge on unmount
        gameRef.current = null;
      }
    };
  }, [spaceData, spaceId]);

  return <div ref={gameContainerRef} className="absolute inset-0 w-full h-full" />;
}
