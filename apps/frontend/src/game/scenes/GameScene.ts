import Phaser from 'phaser';
import { PlayerEntity } from '../entities/PlayerEntity';
import { InputSystem } from '../systems/InputSystem';
import { WorldMap } from '../systems/WorldMap';
import { GAME_CONFIG } from '../config/constants';
import { useAuthStore } from '../../lib/store';
import { SpaceData, SpaceElement } from '../../lib/types';
import { wsClient } from '@/src/lib/wsClient';
import { api } from '../../lib/api';

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
    const userId = user?.id || 'local-player';
    const username = user?.username || 'Player';

    const avatarKey = (this.registry.get('avatarKey') as string | undefined) ?? 'blackwidow';

    // Create world
    const spaceId = (this.registry.get('spaceId') as string | undefined) ?? '';
    const spaceData =  this.registry.get('spaceData') as SpaceData | undefined;
    const isOfficeSpace = spaceId;
    const parsedWidth = Number(spaceData?.width);
    const parsedHeight = Number(spaceData?.height);

    const width  = Number.isFinite(parsedWidth)  && parsedWidth  > 0 ? parsedWidth  : 1600;
    const height = Number.isFinite(parsedHeight) && parsedHeight > 0 ? parsedHeight : 1200;

    this.worldMap = new WorldMap(this, { theme: isOfficeSpace ? 'office' : 'default', width, height });
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
    const ELEMENT_SCALE = 2;
    const { user } = useAuthStore.getState();
    const currentUserId = user?.id;
    const isOwner = !!currentUserId && el.addedById === currentUserId;

    let gameObj: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Image;

    if (el.element.isCollidable) {
      const sprite = this.elementsGroup.create(el.x, el.y, textureKey) as Phaser.Physics.Arcade.Sprite;
      sprite.setScale(ELEMENT_SCALE);
      sprite.setDepth(GAME_CONFIG.DEPTHS.WALLS);
      (sprite.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      gameObj = sprite;
    } else {
        const img = this.add.image(el.x, el.y, textureKey);
        img.setScale(ELEMENT_SCALE);
        img.setDepth(GAME_CONFIG.DEPTHS.GROUND + 1);
        gameObj = img;
    }

    (gameObj as any).__spaceElementId = el.id;

    // Always make interactive so right-click can fire. cursor hint depends on ownership
    gameObj.setInteractive({ cursor: isOwner ? 'grab' : 'default', draggable: isOwner });
    if (isOwner) {
      this.input.setDraggable(gameObj);
    }

    // Drag to move the position of the element (owner only)
    if (isOwner) {
      gameObj.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
        gameObj.x = dragX;
        gameObj.y = dragY;
      });

      gameObj.on('dragend', () => {
        const newX = Math.round(gameObj.x);
        const newY = Math.round(gameObj.y);

        if (el.element.isCollidable) {
          const body = (gameObj as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.StaticBody;
          body.reset(newX, newY);
        }

        const spaceElementId = (gameObj as any).__spaceElementId as string;
        if (spaceElementId) {
          api.updateElementPosition(spaceElementId, newX, newY)
            .catch(err => console.error('[GameScene] Failed to update element position:', err));
        }
      });
    }

    // Right click to delete (owner only)
    gameObj.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() && isOwner) {
        const spaceElementId = (gameObj as any).__spaceElementId as string;
        if (spaceElementId) {
          api.deleteElementFromSpace(spaceElementId)
            .then(() => {
              gameObj.destroy();
              console.log('[GameScene] Element deleted:', spaceElementId);
            })
            .catch(err => console.error('[GameScene] Failed to delete element:', err));
        }
      }
    });
  }

  private handleAddElementEvent = (e: CustomEvent) => {
    console.log('Add element event received', e.detail);

    const { id, element, x, y, addedById } = e.detail as {
      id: string;
      element: SpaceElement['element'];
      x: number;
      y: number;
      addedById?: string;
    };
    console.log('[GameScene] add-element received', { id, element, x, y, addedById });

    const spaceEl: SpaceElement = { id, element, x, y, addedById };
    this.addElement(spaceEl);
  };

  setupNetworking() {
    const userId = this.registry.get('userId') as string;

    const isAlive = () => !!this.scene?.scene;

    // Server confirms join: move local player to authoritative spawn point and spawn everyone already in the space
    const onSpaceJoined = (data: { spawn: { x: number; y: number }; users: { id: string; x: number; y: number }[] }) => {
      console.log('[GameScene] space-joined received', data);

      // Wait one frame to ensure physics body is fully ready
      this.time.delayedCall(32, () => {
        if (!this.localPlayer?.body) {
          console.warn('[GameScene] space-joined delayedCall: localPlayer body not ready');
          return;
        }

        const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
        body.reset(data.spawn.x, data.spawn.y);
        this.localPlayer.x = data.spawn.x;
        this.localPlayer.y = data.spawn.y;
        this.localPlayer.targetX = data.spawn.x;
        this.localPlayer.targetY = data.spawn.y;
        this.spawnConfirmed = true;
        console.log('[GameScene] spawnConfirmed at px', data.spawn.x, data.spawn.y);
      });

      data.users.forEach((u) => {
        if (u.id === userId) return; // skip self
        if (this.remotePlayers.has(u.id)) return;
        if (!isAlive()) return;

        const remotePlayer = new PlayerEntity(
          this, u.x, u.y,
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
      // Guard: scene may have been destroyed before this fires
      if (!isAlive() || !this.localPlayer?.body) {
        console.warn('[GameScene] movement-rejected fired but localPlayer body is gone');
        return;
      }
      const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
      body.reset(data.x, data.y);
      this.localPlayer.x = data.x;
      this.localPlayer.y = data.y;
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
  
    wsClient.on('space-joined', onSpaceJoined);
    wsClient.on('user-join', onUserJoin);
    wsClient.on('movement', onMovement);
    wsClient.on('movement-rejected', onMovementRejected);
    wsClient.on('user-left', onUserLeft);
  
    // Clean up ALL listeners when this scene shuts down
    this.events.once('shutdown', () => {
      this.spawnConfirmed = false;
      wsClient.off('space-joined', onSpaceJoined);
      wsClient.off('user-join', onUserJoin);
      wsClient.off('movement', onMovement);
      wsClient.off('movement-rejected', onMovementRejected);
      wsClient.off('user-left', onUserLeft);
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

    // Throttle sends to ~10fps, send raw pixel position
    // Backend now validates with a 160px max-distance check (not tile-step)
    if (time - this.lastSendTime > 100 && (moveVector.x !== 0 || moveVector.y !== 0)) {
      wsClient.sendMovement(this.localPlayer.x, this.localPlayer.y);
      this.lastSendTime = time;
    }

    this.remotePlayers.forEach(player => player.update(time, delta));
  }
}