import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

const AVATARS = [
  {
    key: 'blackwidow',
    sheets: {
      idle:  { path: '/mcu-avatars/blackwidow-idle.png',  frameWidth: 32, frameHeight: 32 },
      down:  { path: '/mcu-avatars/blackwidow-down.png',  frameWidth: 32, frameHeight: 32 },
      left:  { path: '/mcu-avatars/blackwidow-left.png',  frameWidth: 32, frameHeight: 32 },
      right: { path: '/mcu-avatars/blackwidow-right.png', frameWidth: 32, frameHeight: 32 },
      up:    { path: '/mcu-avatars/blackwidow-up.png',    frameWidth: 32, frameHeight: 32 },
    }
  },
  {
    key: 'ironmanmk7',
    sheets: {
      idle:  { path: '/mcu-avatars/ironmanmk7-idle.png',  frameWidth: 32, frameHeight: 32 },
      down:  { path: '/mcu-avatars/ironmanmk7-down.png',  frameWidth: 32, frameHeight: 32 },
      left:  { path: '/mcu-avatars/ironmanmk7-left.png',  frameWidth: 32, frameHeight: 32 },
      right: { path: '/mcu-avatars/ironmanmk7-right.png', frameWidth: 32, frameHeight: 32 },
      up:    { path: '/mcu-avatars/ironmanmk7-up.png',    frameWidth: 32, frameHeight: 32 },
    }
  },
];

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // Load ALL character sprites. (other players may use any avatar)
    for (const avatar of AVATARS) {
      // idle: single frame, 32×32
      this.load.spritesheet(`${avatar.key}_idle`, avatar.sheets.idle.path, {
        frameWidth: 32,
        frameHeight: 32,
      });

      // walk cycles: 3 frames across a 96×32 strip
      for (const dir of ['down', 'left', 'right', 'up'] as const) {
        this.load.spritesheet(`${avatar.key}_${dir}`, avatar.sheets[dir].path, {
          frameWidth: 32,   // 96 / 3 frames = 32px each
          frameHeight: 32,
        });
      }
    }

    // Office furniture
    // this.load.image('office_desk',          '/free-office-pixel-art/desk.png');
    // this.load.image('office_chair',         '/free-office-pixel-art/Chair.png');
    // this.load.image('office_plant',         '/free-office-pixel-art/plant.png');
    // this.load.image('office_worker_1',      '/free-office-pixel-art/worker1.png');
    // this.load.image('office_worker_2',      '/free-office-pixel-art/worker2.png');
    // this.load.image('office_worker_4',      '/free-office-pixel-art/worker4.png');
    // this.load.image('office_cabinet',       '/free-office-pixel-art/cabinet.png');
    // this.load.image('office_printer',       '/free-office-pixel-art/printer.png');
    // this.load.image('office_pc1',           '/free-office-pixel-art/PC1.png');
    // this.load.image('office_pc2',           '/free-office-pixel-art/PC2.png');
    // this.load.image('office_trash',         '/free-office-pixel-art/Trash.png');
    // this.load.image('office_sink',          '/free-office-pixel-art/sink.png');
    // this.load.image('office_water_cooler',  '/free-office-pixel-art/water-cooler.png');
    // this.load.image('office_partition1',    '/free-office-pixel-art/office-partitions-1.png');
    // this.load.image('office_partition2',    '/free-office-pixel-art/office-partitions-2.png');
    // this.load.image('office_writing_table', '/free-office-pixel-art/writing-table.png');
    // this.load.image('office_coffee_maker',  '/free-office-pixel-art/coffee-maker.png');

    // Debug listeners
    this.load.on('filecomplete', (key: string) => {
      console.log('Loaded:', key);
    });

    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.error('Failed:', file.key, '→', file.src);
    });
  }

  create() {

    // Generate procedural textures
    // this.createTexture('player', GAME_CONFIG.COLORS.PLAYER);
    // this.createTexture('remote_player', GAME_CONFIG.COLORS.REMOTE_PLAYER);
    // this.createHumanTexture('player_human', 0x3b82f6, 0x1f2937);
    // this.createHumanTexture('remote_player_human', 0xef4444, 0x111827);
    this.createTexture('wall', GAME_CONFIG.COLORS.WALL);
    this.createTexture('ground', GAME_CONFIG.COLORS.GROUND);

    this.scene.start('GameScene');
  }

  createTexture(key: string, color: number) {
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
