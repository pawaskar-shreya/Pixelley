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
  private spawnConfirmed: boolean = false;

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

    console.log('[GameScene] setupNetworking called');
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

    const isAlive = () => this.sys.isActive();

    // Server confirms join: move local player to authoritative spawn point and spawn everyone already in the space
    const onSpaceJoined = (data: { spawn: { x: number; y: number }; users: { id: string }[] }) => {
      console.log('[GameScene] space-joined received', data);

      if (!isAlive()) {
        console.warn('[GameScene] space-joined ignored — scene no longer active');
        return;
      }

      // Wait one frame to ensure physics body is fully ready
      this.time.delayedCall(32, () => {

        if (!isAlive() || !this.localPlayer?.body) {
          console.warn('[GameScene] space-joined delayedCall — scene or body gone');
          return;
        }

        const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
        body.reset(data.spawn.x, data.spawn.y);
        this.localPlayer.x       = data.spawn.x;
        this.localPlayer.y       = data.spawn.y;
        this.localPlayer.targetX = data.spawn.x;
        this.localPlayer.targetY = data.spawn.y;
        this.spawnConfirmed = true;
        console.log('[GameScene] spawnConfirmed at', data.spawn.x, data.spawn.y);
      });

      data.users.forEach((u) => {
        if (u.id === userId) return; // skip self
        if (this.remotePlayers.has(u.id)) return;
        if (!isAlive()) return;

        const remotePlayer = new PlayerEntity(
          this, 0, 0,
          u.id, `Player ${u.id.slice(-4)}`,
          false
        );
        this.remotePlayers.set(u.id, remotePlayer);
      });
    };

    // Another user joined mid-session
    const onUserJoin = (data: { userId: string; x: number; y: number }) => {
      if (!isAlive()) return;
      if (this.remotePlayers.has(data.userId)) return;
      const remotePlayer = new PlayerEntity(
        this, data.x, data.y,
        data.userId, `Player ${data.userId.slice(-4)}`,
        false
      );
      this.remotePlayers.set(data.userId, remotePlayer);
    };
  
    const onMovement = (data: { userId: string; x: number; y: number }) => {
      if (!isAlive()) return;
      const player = this.remotePlayers.get(data.userId);
      if (player) {
        player.targetX = data.x;
        player.targetY = data.y;
      }
    };
  
    const onMovementRejected = (data: { x: number; y: number }) => {
      // Guard — scene may have been destroyed before this fires
      if (!isAlive() || !this.localPlayer?.body) {
        console.warn('[GameScene] movement-rejected fired but localPlayer body is gone');
        return;
      }
      const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
      body.reset(data.x, data.y);
      this.localPlayer.x       = data.x;
      this.localPlayer.y       = data.y;
      this.localPlayer.targetX = data.x;
      this.localPlayer.targetY = data.y;
    };
  
    const onUserLeft = (data: { userId: string }) => {
      if (!isAlive()) return;
      const player = this.remotePlayers.get(data.userId);
      if (player) {
        player.destroy();
        this.remotePlayers.delete(data.userId);
      }
    };
  
    wsClient.on('space-joined',       onSpaceJoined);
    wsClient.on('user-join',          onUserJoin);
    wsClient.on('movement',           onMovement);
    wsClient.on('movement-rejected',  onMovementRejected);
    wsClient.on('user-left',          onUserLeft);
  
    // Clean up ALL listeners when this scene shuts down
    this.events.once('shutdown', () => {
      this.spawnConfirmed = false;
      wsClient.off('space-joined',      onSpaceJoined);
      wsClient.off('user-join',         onUserJoin);
      wsClient.off('movement',          onMovement);
      wsClient.off('movement-rejected', onMovementRejected);
      wsClient.off('user-left',         onUserLeft);
    });
  }

  update(time: number, delta: number) {
    const moveVector = this.inputSystem.getMovementVector();
    const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;

    if (!this.spawnConfirmed) {
      body.setVelocity(0, 0);
      return;
    }

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