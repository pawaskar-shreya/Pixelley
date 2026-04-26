import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

export class PlayerEntity extends Phaser.GameObjects.Container {
  public sprite: Phaser.GameObjects.Sprite;
  public nametag: Phaser.GameObjects.Text;
  public targetX: number;
  public targetY: number;
  private isLocal: boolean;
  private usingJulia: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    name: string,
    isLocal: boolean = false,
    useOfficeCharacter: boolean = false
  ) {
    super(scene, x, y);
    this.isLocal = isLocal;
    this.targetX = x;
    this.targetY = y;
    this.usingJulia = scene.textures.exists('julia_idle');

    console.log(`🎮 PlayerEntity [${id}] usingJulia=${this.usingJulia} isLocal=${isLocal}`);

    // Shadow
    const shadow = scene.add.ellipse(
      0, GAME_CONFIG.TILE_SIZE / 2,
      GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE / 2,
      0x000000, 0.3
    );
    this.add(shadow);

    // Sprite
    if (this.usingJulia) {
      this.sprite = scene.add.sprite(0, 0, 'julia_idle', 0).setScale(1.8);
      this.ensureJuliaAnimations(scene);
      this.sprite.play('julia_anim_idle', true);
    } else {
      const textureKey = isLocal ? 'player_human' : 'remote_player_human';
      this.sprite = scene.add.sprite(0, 0, textureKey);
    }
    this.add(this.sprite);

    // Nametag
    this.nametag = scene.add
      .text(0, -GAME_CONFIG.TILE_SIZE, name, {
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    this.add(this.nametag);

    scene.add.existing(this);

    if (isLocal) {
      scene.physics.add.existing(this);
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setSize(GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE);
      body.setOffset(-GAME_CONFIG.TILE_SIZE / 2, -GAME_CONFIG.TILE_SIZE / 2);
      body.setCollideWorldBounds(true);
      body.allowRotation = false;
    }

    this.setDepth(GAME_CONFIG.DEPTHS.PLAYERS);
  }

  update(time: number, delta: number) {
    let velocityX = 0;
    let velocityY = 0;

    if (this.isLocal && this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      velocityX = body.velocity.x;
      velocityY = body.velocity.y;
    }

    if (!this.isLocal) {
      this.x = Phaser.Math.Linear(this.x, this.targetX, 0.2);
      this.y = Phaser.Math.Linear(this.y, this.targetY, 0.2);
      velocityX = this.targetX - this.x;
      velocityY = this.targetY - this.y;
    }

    if (this.usingJulia) {
      this.updateJuliaAnimation(velocityX, velocityY);
    }
  }

  private ensureJuliaAnimations(scene: Phaser.Scene) {
    const defs = [
      // Julia-Idle.png = 128x32 → 4 frames (0–3)
      { key: 'julia_anim_idle',    texture: 'julia_idle',         start: 0, end: 3, frameRate: 6 },
      // Walk PNGs = 256x64 → 8 frames, row 1 = 0–3, row 2 = 4–7
      { key: 'julia_anim_forward', texture: 'julia_walk_forward', start: 0, end: 3, frameRate: 8 },
      { key: 'julia_anim_left',    texture: 'julia_walk_left',    start: 0, end: 3, frameRate: 8 },
      { key: 'julia_anim_right',   texture: 'julia_walk_right',   start: 0, end: 3, frameRate: 8 },
      { key: 'julia_anim_up',      texture: 'julia_walk_up',      start: 0, end: 3, frameRate: 8 },
    ];

    defs.forEach(({ key, texture, start, end, frameRate }) => {
      if (!scene.anims.exists(key) && scene.textures.exists(texture)) {
        scene.anims.create({
          key,
          frames: scene.anims.generateFrameNumbers(texture, { start, end }),
          frameRate,
          repeat: -1,
        });
        console.log('✅ Anim created:', key);
      } else if (!scene.textures.exists(texture)) {
        console.warn(`⚠️ Missing texture for anim "${key}": needs "${texture}"`);
      }
    });
  }

  private updateJuliaAnimation(velocityX: number, velocityY: number) {
    const moving = Math.hypot(velocityX, velocityY) > 8;

    if (!moving) {
      if (this.sprite.anims.currentAnim?.key !== 'julia_anim_idle') {
        this.sprite.play('julia_anim_idle', true);
      }
      return;
    }

    if (Math.abs(velocityY) >= Math.abs(velocityX)) {
      this.sprite.play(velocityY > 0 ? 'julia_anim_forward' : 'julia_anim_up', true);
    } else {
      this.sprite.play(velocityX > 0 ? 'julia_anim_right' : 'julia_anim_left', true);
    }
  }
}
