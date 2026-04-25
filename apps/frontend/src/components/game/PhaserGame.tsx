import { useEffect, useRef } from 'react';
import { getPhaserConfig } from '../../game/config/phaserConfig';
import { SpaceData } from '../../lib/types';

interface PhaserGameProps {
  spaceData?: SpaceData;
}

export default function PhaserGame({ spaceData }: PhaserGameProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && gameContainerRef.current && !gameRef.current) {
      // Ensure the container has dimensions before initializing
      const initGame = () => {
        if (!gameContainerRef.current) return;
        const width = gameContainerRef.current.clientWidth;
        const height = gameContainerRef.current.clientHeight;
        
        if (width === 0 || height === 0) {
          requestAnimationFrame(initGame);
          return;
        }

        import('phaser').then((Phaser) => {
          const config = getPhaserConfig(gameContainerRef.current!);
          gameRef.current = new Phaser.default.Game(config);
          
          // Pass spaceData to the game registry so scenes can access it
          if (spaceData) {
            gameRef.current.registry.set('spaceData', spaceData);
          }
        });
      };

      initGame();
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [spaceData]);

  return <div ref={gameContainerRef} className="absolute inset-0 w-full h-full" />;
}
