/* PreloadScene is used to laod only the character avatars as these are going to be common to all spaces */
/* All the other spaces are loaded individually in their own scene */

import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';
import { Avatar, avatarToKey } from '../../lib/types';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    const avatars = (this.registry.get('avatars') as Avatar[]) ?? [];

    if (avatars.length === 0) {
      console.warn('[PreloadScene] No avatars in registry. Did PhaserGame fetch them?');
    }

    // Load ALL character sprites. (other players may use any avatar)
    for (const avatar of avatars) {
      const key = avatarToKey(avatar.name);

      // idle: single frame, 32×32
      this.load.spritesheet(`${key}_idle`, avatar.idleUrl, {
        frameWidth: 32, frameHeight: 32,
      });

      // walk cycles: 3 frames across a 96×32 strip
      this.load.spritesheet(`${key}_down`,  avatar.downUrl,  { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet(`${key}_left`,  avatar.leftUrl,  { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet(`${key}_right`, avatar.rightUrl, { frameWidth: 32, frameHeight: 32 });
      this.load.spritesheet(`${key}_up`,    avatar.upUrl,    { frameWidth: 32, frameHeight: 32 });
    }

    // Debug listeners
    this.load.on('filecomplete', (key: string) => {
      console.log('[PreloadScene] Loaded:', key);
    });

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error('[PreloadScene] Failed:', file.key, '->', file.src);
    });
  }

  create() {
    // this.createFlat('wall', GAME_CONFIG.COLORS.WALL);
    // this.createFlat('ground', GAME_CONFIG.COLORS.GROUND);

    this.scene.start('LobbyScene');
  }

  createFlat(key: string, color: number) {
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    graphics.generateTexture(key, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    graphics.destroy();
  }

  private createHumanTexture(key: string, shirtColor: number, pantColor: number) {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0);
    g.fillRect(0, 0, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    g.fillStyle(0xf2c49a, 1);
    g.fillRect(10, 2, 12, 10);
    g.fillStyle(0x3b2a1f, 1);
    g.fillRect(9, 1, 14, 4);
    g.fillStyle(shirtColor, 1);
    g.fillRect(9, 12, 14, 10);
    g.fillStyle(pantColor, 1);
    g.fillRect(10, 22, 5, 8);
    g.fillRect(17, 22, 5, 8);
    g.generateTexture(key, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    g.destroy();
  }
}
