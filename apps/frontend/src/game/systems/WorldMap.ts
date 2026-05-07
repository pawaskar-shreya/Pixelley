import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

type MapTheme = 'office' | 'default';

// Base class all space maps extend

abstract class BaseMap {
  public bounds: Phaser.Geom.Rectangle;
  protected walls: Phaser.Physics.Arcade.StaticGroup;
  protected scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene = scene;
    this.bounds = new Phaser.Geom.Rectangle(0, 0, width, height);
    this.walls = scene.physics.add.staticGroup();
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
    this.addRectCollider(0, 0, width, 8);      // top
    this.addRectCollider(0, height - 8, width, 8);      // bottom
    this.addRectCollider(0, 0, 8, height); // left
    this.addRectCollider(width - 8, 0, 8, height); // right
  }

  abstract build(): void;

  getColliders() {
    return this.walls;
  }
}

// ----------- Office map -------------

class OfficeMap extends BaseMap {
  constructor(scene: Phaser.Scene) {
    // Office reference image is 1200x800
    super(scene, 1500, 1000);
  }

  build() {
    this.drawBase();
    this.drawElements();
    this.addColliders();
  }

  private drawBase() {
    const rows = Math.ceil(this.bounds.height / GAME_CONFIG.TILE_SIZE);

    // Ceiling strip: soft warm cream
    this.scene.add
      .rectangle(0, 0, this.bounds.width, GAME_CONFIG.TILE_SIZE * 9, 0xfff5e6)
      .setOrigin(0, 0)
      .setDepth(GAME_CONFIG.DEPTHS.GROUND);

    // Ceiling border line: pastel peachy outline
    this.scene.add
      .rectangle(0, GAME_CONFIG.TILE_SIZE * 6, this.bounds.width, 6, 0xf4c3a0)
      .setOrigin(0, 0)
      .setDepth(GAME_CONFIG.DEPTHS.GROUND + 1);

    // Carpet tiles: alternating soft lavender & lilac
    for (let y = 9; y < rows; y++) {
      const color = y % 2 === 0 ? 0xd4b8ff : 0xc8a8ff;
      this.scene.add
        .rectangle(0, y * GAME_CONFIG.TILE_SIZE, this.bounds.width, GAME_CONFIG.TILE_SIZE, color)
        .setOrigin(0, 0)
        .setDepth(GAME_CONFIG.DEPTHS.GROUND);

      // Tile grout line: slightly darker lavender
      this.scene.add
        .rectangle(0, y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE - 3, this.bounds.width, 3, 0xb09ce0)
        .setOrigin(0, 0)
        .setDepth(GAME_CONFIG.DEPTHS.GROUND + 1);
    }
  }

  private drawElements() {
    const workerKeys = ['office_worker1', 'office_worker2', 'office_worker4'].filter(
      key => this.scene.textures.exists(key)
    );

    const hasDesk = this.scene.textures.exists('office_desk');
    const hasChair = this.scene.textures.exists('office_chair');

    if (!hasDesk || !hasChair) {
      console.warn('[OfficeMap] Missing desk/chair textures: skipping element draw');
      return;
    }

    const DESK_ROWS = [420, 580, 740];
    const DESK_COLS = [180, 360, 540, 720, 900];
    const workerScale = 2;

    DESK_ROWS.forEach(y => {
      DESK_COLS.forEach(x => {

        // Random worker seated at the desk
        if (workerKeys.length > 0) {
          const key = workerKeys[Math.floor(Math.random() * workerKeys.length)];
          this.scene.add.image(x - 14, y + 8, key)
            .setScale(workerScale)
            .setDepth(GAME_CONFIG.DEPTHS.PLAYERS - 1);
        }
      });
    });
  }

  private addColliders() {
    this.addWorldBounds();

    // One invisible collider per workstation (5 cols × 3 rows)
    // Sized to cover the desk sprite footprint so players can't walk through desks
    const DESK_ROWS = [420, 580, 740];
    const DESK_COLS = [180, 360, 540, 720, 900];
    const CW = 52; // collider half-width from centre
    const CH = 36; // collider half-height from centre

    DESK_ROWS.forEach(cy => {
      DESK_COLS.forEach(cx => {
        this.addRectCollider(cx - CW, cy - CH, CW * 2, CH * 2);
      });
    });
  }
}

// ---------- Default / fallback map --------------------

class DefaultMap extends BaseMap {
  constructor(scene: Phaser.Scene, width: number, height: number) {
    super(scene, width, height);
  }

  build() {
    const cols = Math.ceil(this.bounds.width / GAME_CONFIG.TILE_SIZE);
    const rows = Math.ceil(this.bounds.height / GAME_CONFIG.TILE_SIZE);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // Alternating soft mint green & slightly brighter mint
        const color = (x + y) % 2 === 0 ? 0xb8e8c8 : 0xa8d8b9;
        this.scene.add
          .rectangle(
            x * GAME_CONFIG.TILE_SIZE,
            y * GAME_CONFIG.TILE_SIZE,
            GAME_CONFIG.TILE_SIZE,
            GAME_CONFIG.TILE_SIZE,
            color
          )
          .setOrigin(0, 0)
          .setDepth(GAME_CONFIG.DEPTHS.GROUND);

        // Soft grout lines
        this.scene.add
          .rectangle(
            x * GAME_CONFIG.TILE_SIZE,
            y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE - 1,
            GAME_CONFIG.TILE_SIZE,
            1,
            0x8ecbaa
          )
          .setOrigin(0, 0)
          .setDepth(GAME_CONFIG.DEPTHS.GROUND + 1);
      }
    }

    this.addWorldBounds();
  }
}

// ------- WorldMap: router, the only thing GameScene imports -----------

export class WorldMap {
  public bounds: Phaser.Geom.Rectangle;
  private map: BaseMap;

  constructor(scene: Phaser.Scene, opts?: { theme?: MapTheme; width?: number; height?: number }) {
    const theme = opts?.theme ?? 'default';
    const width = opts?.width ?? 1600;
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