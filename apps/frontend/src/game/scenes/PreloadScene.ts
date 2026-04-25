import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Office map assets (served from /public)
    // Use absolute paths so this works on non-root routes (e.g. /space)
    this.load.image('office_map_small', '/assets/office/PixelOffice.png');
    this.load.image('office_map_large', '/assets/office/LargePixelOffice.png');
    // Sprite sheet of office parts (16x16 tiles; some props span multiple tiles)
    this.load.spritesheet('office_assets', '/assets/office/PixelOfficeAssets.png', {
      frameWidth: 16,
      frameHeight: 16,
    });
  }

  createTexture(key: string, color: number) {
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    graphics.generateTexture(key, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
    graphics.destroy();
  }

  create() {
    // Generate procedural textures
    this.createTexture('player', GAME_CONFIG.COLORS.PLAYER);
    this.createTexture('remote_player', GAME_CONFIG.COLORS.REMOTE_PLAYER);
    this.createTexture('wall', GAME_CONFIG.COLORS.WALL);
    this.createTexture('ground', GAME_CONFIG.COLORS.GROUND);

    this.scene.start('GameScene');
  }
}
