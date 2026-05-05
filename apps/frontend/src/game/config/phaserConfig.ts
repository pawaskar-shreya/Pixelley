import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { LobbyScene } from '../scenes/LobbyScene';
import { GameScene } from '../scenes/GameScene';

// Space specific preload scenes, add more scenes to add mroe spaces
import { OfficePreloadScene } from '../scenes/OfficePreloadScene';


export const getPhaserConfig = (parent: HTMLElement): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: 'space-container',
  backgroundColor: '#1a1a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: true,
    },
  },
  scene: [BootScene, PreloadScene, LobbyScene, OfficePreloadScene, GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
});
