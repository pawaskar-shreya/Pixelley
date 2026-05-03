import Phaser from 'phaser';
import { PlayerEntity } from '../entities/PlayerEntity';
import { InputSystem } from '../systems/InputSystem';
import { WorldMap } from '../systems/WorldMap';
import { GAME_CONFIG } from '../config/constants';
import { useAuthStore } from '../../lib/store';
import { SpaceData, SpaceElement } from '../../lib/types';
import { wsClient } from '@/src/lib/wsClient';

export class GameScene extends Phaser.Scene {
  private localPlayer!: PlayerEntity;
  private remotePlayers: Map<string, PlayerEntity> = new Map();
  private inputSystem!: InputSystem;
  private worldMap!: WorldMap;
  private lastSendTime: number = 0;
  private elementsGroup!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super('GameScene');
  }

  create() {
    const { user } = useAuthStore.getState();
    const userId   = user?.id       || 'local-player';
    const username = user?.username || 'Player';

    const avatarKey = (this.registry.get('avatarKey') as string | undefined) ?? 'blackwidow';

    // Create world
    const spaceId   = (this.registry.get('spaceId')   as string    | undefined) ?? '';
    const spaceData =  this.registry.get('spaceData')  as SpaceData | undefined;

    const isOfficeSpace = spaceId === 's1';
    const defaultWidth  = Number.isFinite(spaceData?.width)  ? (spaceData?.width  as unknown as number) : 1600;
    const defaultHeight = Number.isFinite(spaceData?.height) ? (spaceData?.height as unknown as number) : 1200;

    const width  = isOfficeSpace ? 1024 : defaultWidth;
    const height = isOfficeSpace ? 896  : defaultHeight;

    this.worldMap      = new WorldMap(this, { theme: isOfficeSpace ? 'office' : 'default', width, height });
    this.elementsGroup = this.physics.add.staticGroup();

    if (spaceData?.elements) {
      this.loadElements(spaceData.elements);
    }

    // Placeholder spawn: immediately overwritten by 'space-joined' from server
    this.localPlayer = new PlayerEntity(this, 120, 260, userId, username, true, avatarKey);

    // Store userId in registry so setupNetworking can filter self out of user lists
    this.registry.set('userId', userId);

    this.physics.add.collider(this.localPlayer, this.worldMap.getColliders());
    this.physics.add.collider(this.localPlayer, this.elementsGroup);

    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.worldMap.bounds.width, this.worldMap.bounds.height);

    this.inputSystem = new InputSystem(this);

    this.setupNetworking();

    window.addEventListener('add-element', this.handleAddElementEvent as EventListener);
    this.events.once('shutdown', () => {
      window.removeEventListener('add-element', this.handleAddElementEvent as EventListener);
    });
  }

  private loadElements(elements: SpaceElement[]) {
    elements.forEach(el => this.addElement(el));
  }

  private addElement(el: SpaceElement) {
    const textureKey = `element_${el.element.id}`;

    if (!this.textures.exists(textureKey)) {
      this.load.image(textureKey, el.element.imageUrl);
      this.load.once(`filecomplete-image-${textureKey}`, () => {
        this.spawnElementSprite(el, textureKey);
      });
      this.load.start();
    } else {
      this.spawnElementSprite(el, textureKey);
    }
  }

  private spawnElementSprite(el: SpaceElement, textureKey: string) {
    if (el.element.isCollidable) {
      const sprite = this.elementsGroup.create(el.x, el.y, textureKey);
      sprite.setDepth(GAME_CONFIG.DEPTHS.WALLS);
    } else {
      const sprite = this.add.image(el.x, el.y, textureKey);
      sprite.setDepth(GAME_CONFIG.DEPTHS.GROUND + 1);
    }
  }

  private handleAddElementEvent = (e: CustomEvent) => {
    console.log('Add element event received', e.detail);
  };

  setupNetworking() {
    const userId = this.registry.get('userId') as string;

    // Server confirms join: move local player to authoritative spawn point and spawn everyone already in the space
    wsClient.on('space-joined', (data: { spawn: { x: number; y: number }; users: { id: string }[] }) => {
      const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
      body.reset(data.spawn.x, data.spawn.y);
      this.localPlayer.x       = data.spawn.x;
      this.localPlayer.y       = data.spawn.y;
      this.localPlayer.targetX = data.spawn.x;
      this.localPlayer.targetY = data.spawn.y;

      data.users.forEach((u) => {
        if (u.id === userId) return; // skip self
        if (this.remotePlayers.has(u.id)) return;

        const remotePlayer = new PlayerEntity(
          this, 0, 0,
          u.id, `Player ${u.id.slice(-4)}`,
          false
        );
        this.remotePlayers.set(u.id, remotePlayer);
      });
    });

    // Another user joined mid-session
    wsClient.on('user-join', (data: { userId: string; x: number; y: number }) => {
      if (this.remotePlayers.has(data.userId)) return;

      const remotePlayer = new PlayerEntity(
        this, data.x, data.y,
        data.userId, `Player ${data.userId.slice(-4)}`,
        false
      );
      this.remotePlayers.set(data.userId, remotePlayer);
    });

    // Another user moved: update their interpolation target
    wsClient.on('movement', (data: { userId: string; x: number; y: number }) => {
      const player = this.remotePlayers.get(data.userId);
      if (player) {
        player.targetX = data.x;
        player.targetY = data.y;
      }
    });

    // Server rejected our move: snap local player back to authoritative position
    wsClient.on('movement-rejected', (data: { x: number; y: number }) => {
      const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
      body.reset(data.x, data.y);
      this.localPlayer.x       = data.x;
      this.localPlayer.y       = data.y;
      this.localPlayer.targetX = data.x;
      this.localPlayer.targetY = data.y;
    });

    // User left
    wsClient.on('user-left', (data: { userId: string }) => {
      const player = this.remotePlayers.get(data.userId);
      if (player) {
        player.destroy();
        this.remotePlayers.delete(data.userId);
      }
    });
  }

  update(time: number, delta: number) {
    const moveVector = this.inputSystem.getMovementVector();
    const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(
      moveVector.x * GAME_CONFIG.PLAYER_SPEED,
      moveVector.y * GAME_CONFIG.PLAYER_SPEED
    );

    this.localPlayer.update(time, delta);

    // Throttle sends to ~10fps, only send when actually moving
    if (time - this.lastSendTime > 100 && (moveVector.x !== 0 || moveVector.y !== 0)) {
      wsClient.sendMovement(this.localPlayer.x, this.localPlayer.y);
      this.lastSendTime = time;
    }

    this.remotePlayers.forEach(player => player.update(time, delta));
  }
}