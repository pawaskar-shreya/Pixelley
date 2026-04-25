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

  preload() {
    const spaceData = this.registry.get('spaceData') as SpaceData | undefined;
    if (spaceData?.elements) {
      spaceData.elements.forEach(el => {
        if (!this.textures.exists(`element_${el.element.id}`)) {
          this.load.image(`element_${el.element.id}`, el.element.imageUrl);
        }
      });
    }
  }

  create() {
    const { user } = useAuthStore.getState();
    const userId = user?.id || 'local-player';
    const username = user?.username || 'Player';

    // Create world
    const spaceId = (this.registry.get('spaceId') as string | undefined) ?? '';
    const spaceData = this.registry.get('spaceData') as SpaceData | undefined;
    // Only the first space (mock seed: s1) gets the office map.
    const isOfficeSpace = spaceId === 's1';
    const dims = spaceData?.dimensions?.split('x').map(n => Number(n.trim())) ?? [];
    const defaultWidth = Number.isFinite(dims[0]) ? (dims[0] as number) : 1600;
    const defaultHeight = Number.isFinite(dims[1]) ? (dims[1] as number) : 1200;

    // Office reference image is 1024x896; use that to prevent cropping/distortion.
    const width = isOfficeSpace ? 1024 : defaultWidth;
    const height = isOfficeSpace ? 896 : defaultHeight;

    this.worldMap = new WorldMap(this, { theme: isOfficeSpace ? 'office' : 'default', width, height });
    this.elementsGroup = this.physics.add.staticGroup();

    // Load initial elements
    if (spaceData?.elements) {
      this.loadElements(spaceData.elements);
    }

    // Create local player
    this.localPlayer = new PlayerEntity(this, 120, 260, userId, username, true, isOfficeSpace);
    
    // Setup collision
    this.physics.add.collider(this.localPlayer, this.worldMap.getColliders());
    this.physics.add.collider(this.localPlayer, this.elementsGroup);

    // Setup camera
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.worldMap.bounds.width, this.worldMap.bounds.height);

    // Setup input
    this.inputSystem = new InputSystem(this);

    // Setup networking
    this.setupNetworking();

    // Listen for add-element events from React
    window.addEventListener('add-element', this.handleAddElementEvent as EventListener);

    this.events.once('shutdown', () => {
      window.removeEventListener('add-element', this.handleAddElementEvent as EventListener);
    });
  }

  private loadElements(elements: SpaceElement[]) {
    elements.forEach(el => {
      this.addElement(el);
    });
  }

  private addElement(el: SpaceElement) {
    const textureKey = `element_${el.element.id}`;
    
    // If texture isn't loaded yet (e.g. added dynamically), load it
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
    if (el.element.static) {
      const sprite = this.elementsGroup.create(el.x, el.y, textureKey);
      sprite.setDepth(GAME_CONFIG.DEPTHS.WALLS);
      // Adjust body size if needed based on element width/height
    } else {
      const sprite = this.add.image(el.x, el.y, textureKey);
      sprite.setDepth(GAME_CONFIG.DEPTHS.GROUND + 1); // Above ground, below walls
    }
  }

  private handleAddElementEvent = (e: CustomEvent) => {
    // In a real app, we'd fetch the full element details or pass them in the event
    // For now, we'll just log it or use a placeholder if we don't have the full element data
    console.log('Add element event received', e.detail);
    // If we passed the full element object in the event, we could call this.addElement(e.detail)
  };

  setupNetworking() {
    wsClient.on('playerJoined', (data: any) => {
      if (!this.remotePlayers.has(data.id)) {
        const spaceId = (this.registry.get('spaceId') as string | undefined) ?? '';
        const isOfficeSpace = spaceId === 's1';
        const remotePlayer = new PlayerEntity(
          this,
          data.x,
          data.y,
          data.id,
          `Player ${data.id.slice(-4)}`,
          false,
          isOfficeSpace
        );
        this.remotePlayers.set(data.id, remotePlayer);
      }
    });

    wsClient.on('playerMoved', (data: any) => {
      const player = this.remotePlayers.get(data.id);
      if (player) {
        player.targetX = data.x;
        player.targetY = data.y;
      }
    });

    wsClient.on('playerLeft', (data: any) => {
      const player = this.remotePlayers.get(data.id);
      if (player) {
        player.destroy();
        this.remotePlayers.delete(data.id);
      }
    });
  }

  update(time: number, delta: number) {
    // Handle local player movement
    const moveVector = this.inputSystem.getMovementVector();
    const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
    
    body.setVelocity(
      moveVector.x * GAME_CONFIG.PLAYER_SPEED,
      moveVector.y * GAME_CONFIG.PLAYER_SPEED
    );

    // Send movement to server (throttle to ~10fps)
    if (time - this.lastSendTime > 100 && (moveVector.x !== 0 || moveVector.y !== 0)) {
      wsClient.sendMovement({
        x: this.localPlayer.x,
        y: this.localPlayer.y,
        vx: body.velocity.x,
        vy: body.velocity.y
      });
      this.lastSendTime = time;
    }

    // Update remote players
    this.remotePlayers.forEach(player => player.update(time, delta));
  }
}
