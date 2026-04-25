import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Load any actual assets here
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
