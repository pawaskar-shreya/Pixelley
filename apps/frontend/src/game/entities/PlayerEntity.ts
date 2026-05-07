import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';
import { Avatar, avatarToKey } from '../../lib/types';

// Walk anims: 3 frames across a 96×32 strip (frameWidth: 32)
const ANIM_DEFS = [
  { suffix: 'idle', start: 0, end: 0, frameRate: 6 },  // single frame
  { suffix: 'down', start: 0, end: 2, frameRate: 8 },  // 3-frame walk cycle
  { suffix: 'left', start: 0, end: 2, frameRate: 8 },
  { suffix: 'right', start: 0, end: 2, frameRate: 8 },
  { suffix: 'up', start: 0, end: 2, frameRate: 8 },
];

export class PlayerEntity extends Phaser.GameObjects.Container {
  public sprite: Phaser.GameObjects.Sprite;
  public nametag: Phaser.GameObjects.Text;
  public targetX: number;
  public targetY: number;
  private isLocal: boolean;
  private avatarKey: string | null;
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    id: string,
    name: string,
    isLocal: boolean = false,
    avatarKey?: string   // passed in from GameScene. Comes from player's chosen avatar based on gender
  ) {
    super(scene, x, y);
    this.isLocal = isLocal;
    this.targetX = x;
    this.targetY = y;
    this.avatarKey = this.resolveAvatarKey(scene, avatarKey);

    console.log(`PlayerEntity [${id}] avatarKey=${this.avatarKey} isLocal=${isLocal}`);

    // Shadow
    const shadow = scene.add.ellipse(
      0, GAME_CONFIG.TILE_SIZE / 2,
      GAME_CONFIG.TILE_SIZE, GAME_CONFIG.TILE_SIZE / 2,
      0x000000, 0.3
    );
    this.add(shadow);

    // Sprite
    if (this.avatarKey) {
      this.sprite = scene.add.sprite(0, 0, `${this.avatarKey}_idle`, 0).setScale(1.8);
      this.ensureAvatarAnimations(scene, this.avatarKey);
      this.sprite.play(`${this.avatarKey}_anim_idle`, true);
    } else {
      // Procedural fallback: keeps the game working even if textures fail to load
      const textureKey = isLocal ? 'player_human' : 'remote_player_human';
      this.sprite = scene.add.sprite(0, 0, textureKey);
    }
    this.add(this.sprite);

    // Nametag — kawaii sticker badge style
    this.nametag = scene.add
      .text(0, -GAME_CONFIG.TILE_SIZE, name, {
        fontSize: '11px',
        fontFamily: "'Nunito', sans-serif",
        color: '#1f1f1f',
        stroke: '#ffffff',
        strokeThickness: 3,
        backgroundColor: '#fffdf7',
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5);
    this.add(this.nametag);

    scene.add.existing(this);

    if (isLocal) {
      scene.physics.add.existing(this);
      const body = this.body as Phaser.Physics.Arcade.Body;

      if (!body) {
        console.error('Physics body failed to attach');
        return;
      }

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

    if (this.avatarKey) {
      this.updateAvatarAnimation(velocityX, velocityY);
    }
  }

  // ----------------- Private helpers ---------------------------------------------

  private resolveAvatarKey(scene: Phaser.Scene, requested?: string): string | null {
    // Get all loaded avatar keys dynamically from registry
    const avatars = (scene.registry.get('avatars') as Avatar[]) ?? [];
    const availableKeys = avatars.map(a => avatarToKey(a.name));

    // Try requested key first
    if (requested && scene.textures.exists(`${requested}_idle`)) {
      return requested;
    }

    // Fall back to first available
    for (const key of availableKeys) {
      if (scene.textures.exists(`${key}_idle`)) {
        console.warn(`Avatar "${requested}" not found, falling back to "${key}"`);
        return key;
      }
    }

    console.warn('No avatar textures loaded, using procedural fallback');
    return null;
  }

  private ensureAvatarAnimations(scene: Phaser.Scene, avatarKey: string) {
    for (const { suffix, start, end, frameRate } of ANIM_DEFS) {
      const animKey = `${avatarKey}_anim_${suffix}`;           // eg, 'blackwidow_anim_left'
      const textureKey = `${avatarKey}_${suffix}`;                // eg, 'blackwidow_left'

      if (scene.anims.exists(animKey)) continue;

      if (!scene.textures.exists(textureKey)) {
        console.warn(`Missing texture "${textureKey}" for anim "${animKey}"`);
        continue;
      }

      scene.anims.create({
        key: animKey,
        frames: scene.anims.generateFrameNumbers(textureKey, { start, end }),
        frameRate,
        repeat: -1,
      });

      console.log('Anim created:', animKey);
    }
  }

  private updateAvatarAnimation(velocityX: number, velocityY: number) {
    if (!this.avatarKey) return;

    const moving = Math.hypot(velocityX, velocityY) > 8;

    if (!moving) {
      const idleKey = `${this.avatarKey}_anim_idle`;
      if (this.sprite.anims.currentAnim?.key !== idleKey) {
        this.sprite.play(idleKey, true);
      }
      return;
    }

    // Favour vertical direction when both axes are equal
    if (Math.abs(velocityY) >= Math.abs(velocityX)) {
      this.sprite.play(
        velocityY > 0
          ? `${this.avatarKey}_anim_down`
          : `${this.avatarKey}_anim_up`,
        true
      );
    } else {
      this.sprite.play(
        velocityX > 0
          ? `${this.avatarKey}_anim_right`
          : `${this.avatarKey}_anim_left`,
        true
      );
    }
  }
}
