import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

type MapTheme = 'office' | 'default';

// Base class all space maps extend

abstract class BaseMap {
  public bounds: Phaser.Geom.Rectangle;
  protected walls: Phaser.Physics.Arcade.StaticGroup;
  protected scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene  = scene;
    this.bounds = new Phaser.Geom.Rectangle(0, 0, width, height);
    this.walls  = scene.physics.add.staticGroup();
    scene.physics.world.setBounds(0, 0, width, height);
  }

  protected addRectCollider(x: number, y: number, w: number, h: number) {
    const wall = this.walls.create(x + w / 2, y + h / 2, 'wall');
    wall.setVisible(false);
    const body = wall.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(w, h);
    body.updateFromGameObject();
  }

  // Outer boundary walls: every space needs these
  protected addWorldBounds() {
    const { width, height } = this.bounds;
    this.addRectCollider(0,         0,          width, 8);      // top
    this.addRectCollider(0,         height - 8, width, 8);      // bottom
    this.addRectCollider(0,         0,          8,     height); // left
    this.addRectCollider(width - 8, 0,          8,     height); // right
  }

  abstract build(): void;

  getColliders() {
    return this.walls;
  }
}

// ----------- Office map -------------

class OfficeMap extends BaseMap {
  constructor(scene: Phaser.Scene) {
    // Office reference image is 1024×896
    super(scene, 1024, 896);
  }

  build() {
    this.drawBase();
    this.drawElements();
    this.addColliders();
  }

  private drawBase() {
    const rows = Math.ceil(this.bounds.height / GAME_CONFIG.TILE_SIZE);

    // Reception / lobby ceiling strip
    this.scene.add
      .rectangle(0, 0, this.bounds.width, GAME_CONFIG.TILE_SIZE * 9, 0xd9dce3)
      .setOrigin(0, 0)
      .setDepth(GAME_CONFIG.DEPTHS.GROUND);

    // Ceiling border line
    this.scene.add
      .rectangle(0, GAME_CONFIG.TILE_SIZE * 6, this.bounds.width, 6, 0xa8b1bf)
      .setOrigin(0, 0)
      .setDepth(GAME_CONFIG.DEPTHS.GROUND + 1);

    // Carpet tiles below reception
    for (let y = 9; y < rows; y++) {
      const color = y % 2 === 0 ? 0x4fa7db : 0x3c95cd;
      this.scene.add
        .rectangle(0, y * GAME_CONFIG.TILE_SIZE, this.bounds.width, GAME_CONFIG.TILE_SIZE, color)
        .setOrigin(0, 0)
        .setDepth(GAME_CONFIG.DEPTHS.GROUND);

      // Tile grout line
      this.scene.add
        .rectangle(0, y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE - 3, this.bounds.width, 3, 0x2f6e9f)
        .setOrigin(0, 0)
        .setDepth(GAME_CONFIG.DEPTHS.GROUND + 1);
    }
  }

  private drawElements() {
    const hasDesk  = this.scene.textures.exists('office_desk');
    const hasChair = this.scene.textures.exists('office_chair');
    const hasPlant = this.scene.textures.exists('office_plant');

    if (!hasDesk || !hasChair || !hasPlant) {
      console.warn('[OfficeMap] Missing office textures — skipping element draw');
      return;
    }

    const deskScale   = 2.2;
    const chairScale  = 2;
    const plantScale  = 2.2;
    const workerScale = 2;

    // Desk rows
    [420, 580, 740].forEach(y => {
      [180, 360, 540, 720, 900].forEach(x => {
        this.scene.add.image(x, y, 'office_desk')
          .setScale(deskScale)
          .setDepth(GAME_CONFIG.DEPTHS.WALLS);
        this.scene.add.image(x - 16, y + 24, 'office_chair')
          .setScale(chairScale)
          .setDepth(GAME_CONFIG.DEPTHS.WALLS + 1);
      });
    });

    // Plants
    this.scene.add.image(390, 320, 'office_plant').setScale(plantScale).setDepth(GAME_CONFIG.DEPTHS.WALLS + 1);
    this.scene.add.image(620, 320, 'office_plant').setScale(plantScale).setDepth(GAME_CONFIG.DEPTHS.WALLS + 1);
    this.scene.add.image(860, 830, 'office_plant').setScale(plantScale).setDepth(GAME_CONFIG.DEPTHS.WALLS + 1);

    // Static NPC workers
    if (this.scene.textures.exists('office_worker1')) {
      this.scene.add.image(270, 460, 'office_worker1').setScale(workerScale).setDepth(GAME_CONFIG.DEPTHS.PLAYERS - 1);
    }
    if (this.scene.textures.exists('office_worker2')) {
      this.scene.add.image(870, 640, 'office_worker2').setScale(workerScale).setDepth(GAME_CONFIG.DEPTHS.PLAYERS - 1);
    }
    if (this.scene.textures.exists('office_worker4')) {
      this.scene.add.image(510, 800, 'office_worker4').setScale(workerScale).setDepth(GAME_CONFIG.DEPTHS.PLAYERS - 1);
    }
  }

  private addColliders() {
    this.addWorldBounds();

    // Desk / cubicle rows
    this.addRectCollider(40, 360, 940, 80);
    this.addRectCollider(40, 520, 940, 80);
    this.addRectCollider(40, 680, 940, 80);

    // Top corridor prop clusters
    this.addRectCollider(0,   210, 430, 80);
    this.addRectCollider(670, 210, 354, 80);

    // Bottom-right cluster (trash/plant/table)
    this.addRectCollider(600, 790, 420, 80);
  }
}

// ---------- Default / fallback map --------------------

class DefaultMap extends BaseMap {
  constructor(scene: Phaser.Scene, width: number, height: number) {
    super(scene, width, height);
  }

  build() {
    const cols = Math.ceil(this.bounds.width  / GAME_CONFIG.TILE_SIZE);
    const rows = Math.ceil(this.bounds.height / GAME_CONFIG.TILE_SIZE);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = this.scene.add.image(
          x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
          y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
          'ground'
        );
        tile.setDepth(GAME_CONFIG.DEPTHS.GROUND);
        if ((x + y) % 2 === 0) tile.setTint(0x1a9e4b);
      }
    }

    // Random obstacle colliders
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(1, cols - 2) * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const y = Phaser.Math.Between(1, rows - 2) * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      this.addRectCollider(x - 16, y - 16, 32, 32);
    }

    this.addWorldBounds();
  }
}

// ------- WorldMap: router, the only thing GameScene imports -----------

export class WorldMap {
  public bounds: Phaser.Geom.Rectangle;
  private map: BaseMap;

  constructor(scene: Phaser.Scene, opts?: { theme?: MapTheme; width?: number; height?: number }) {
    const theme  = opts?.theme  ?? 'default';
    const width  = opts?.width  ?? 1600;
    const height = opts?.height ?? 1200;

    switch (theme) {
      case 'office':
        this.map = new OfficeMap(scene);
        break;
      default:
        this.map = new DefaultMap(scene, width, height);
    }

    this.map.build();
    this.bounds = this.map.bounds;
  }

  getColliders() {
    return this.map.getColliders();
  }
}