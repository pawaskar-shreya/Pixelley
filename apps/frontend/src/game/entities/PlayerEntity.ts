import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

export class PlayerEntity extends Phaser.GameObjects.Container {
  public sprite: Phaser.GameObjects.Sprite;
  public nametag: Phaser.GameObjects.Text;
  public targetX: number;
  public targetY: number;
  private isLocal: boolean;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string, name: string, isLocal: boolean = false) {
    super(scene, x, y);
    this.isLocal = isLocal;
    this.targetX = x;
    this.targetY = y;

    // Shadow
    const shadow = scene.add.ellipse(0, GAME_CONFIG.TILE_SIZE / 2, GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE / 2, 0x000000, 0.3);
    this.add(shadow);

    // Sprite
    const textureKey = isLocal ? 'player' : 'remote_player';
    this.sprite = scene.add.sprite(0, 0, textureKey);
    this.add(this.sprite);

    // Nametag
    this.nametag = scene.add.text(0, -GAME_CONFIG.TILE_SIZE, name, {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.add(this.nametag);

    scene.add.existing(this);
    
    if (isLocal) {
      scene.physics.add.existing(this);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setSize(GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
      body.setOffset(-GAME_CONFIG.TILE_SIZE / 2, -GAME_CONFIG.TILE_SIZE / 2);
      body.setCollideWorldBounds(true);
    }

    this.setDepth(GAME_CONFIG.DEPTHS.PLAYERS);
  }

  update(time: number, delta: number) {
    if (!this.isLocal) {
      // Interpolate remote player
      this.x = Phaser.Math.Linear(this.x, this.targetX, 0.2);
      this.y = Phaser.Math.Linear(this.y, this.targetY, 0.2);
    }
  }
}
