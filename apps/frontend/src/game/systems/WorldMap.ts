import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

type MapTheme = 'office' | 'default';

export class WorldMap {
  public bounds: Phaser.Geom.Rectangle;
  private walls: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: Phaser.Scene, opts?: { theme?: MapTheme; width?: number; height?: number }) {
    const theme: MapTheme = opts?.theme ?? 'default';
    const width = opts?.width ?? 1600;
    const height = opts?.height ?? 1200;

    this.bounds = new Phaser.Geom.Rectangle(0, 0, width, height);
    scene.physics.world.setBounds(0, 0, width, height);

    this.walls = scene.physics.add.staticGroup();

    if (theme === 'office') {
      this.buildOffice(scene);
    } else {
      this.buildDefault(scene);
    }
  }

  private addRectCollider(x: number, y: number, w: number, h: number) {
    // Arcade StaticGroup works most reliably with sprites.
    // We create an invisible "wall" sprite and resize its body.
    const wall = this.walls.create(x + w / 2, y + h / 2, 'wall');
    wall.setVisible(false);
    const body = wall.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(w, h);
    body.updateFromGameObject();
  }

  private buildOffice(scene: Phaser.Scene) {
    this.drawOfficeBase(scene);
    this.drawOfficeElements(scene);

    // Colliders are invisible static bodies; the map art already contains the props visually.
    // Outer bounds blockers (keep players inside world)
    this.addRectCollider(0, 0, this.bounds.width, 8); // top
    this.addRectCollider(0, this.bounds.height - 8, this.bounds.width, 8); // bottom
    this.addRectCollider(0, 0, 8, this.bounds.height); // left
    this.addRectCollider(this.bounds.width - 8, 0, 8, this.bounds.height); // right

    // Desk / cubicle rows (approximate, tuned for 1024x896 reference)
    this.addRectCollider(40, 360, 940, 80);
    this.addRectCollider(40, 520, 940, 80);
    this.addRectCollider(40, 680, 940, 80);

    // Top corridor props (left vending/desk cluster, right sofa/bookshelf cluster)
    this.addRectCollider(0, 210, 430, 80);
    this.addRectCollider(670, 210, 354, 80);

    // Bottom-right cluster (trash/plant/table)
    this.addRectCollider(600, 790, 420, 80);
  }

  private drawOfficeBase(scene: Phaser.Scene) {
    const rows = Math.ceil(this.bounds.height / GAME_CONFIG.TILE_SIZE);
    scene.add.rectangle(0, 0, this.bounds.width, GAME_CONFIG.TILE_SIZE * 9, 0xd9dce3).setOrigin(0, 0).setDepth(GAME_CONFIG.DEPTHS.GROUND);
    scene.add.rectangle(0, GAME_CONFIG.TILE_SIZE * 6, this.bounds.width, 6, 0xa8b1bf).setOrigin(0, 0).setDepth(GAME_CONFIG.DEPTHS.GROUND + 1);

    for (let y = 9; y < rows; y++) {
      const color = y % 2 === 0 ? 0x4fa7db : 0x3c95cd;
      scene.add.rectangle(0, y * GAME_CONFIG.TILE_SIZE, this.bounds.width, GAME_CONFIG.TILE_SIZE, color).setOrigin(0, 0).setDepth(GAME_CONFIG.DEPTHS.GROUND);
      scene.add.rectangle(0, y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE - 3, this.bounds.width, 3, 0x2f6e9f).setOrigin(0, 0).setDepth(GAME_CONFIG.DEPTHS.GROUND + 1);
    }
  }

  private drawOfficeElements(scene: Phaser.Scene) {
    const hasDesk = scene.textures.exists('office_desk');
    const hasChair = scene.textures.exists('office_chair');
    const hasPlant = scene.textures.exists('office_plant');

    if (!(hasDesk && hasChair && hasPlant)) {
      return;
    }

    const deskScale = 2.2;
    const chairScale = 2;
    const plantScale = 2.2;
    const workerScale = 2;

    [420, 580, 740].forEach(y => {
      [180, 360, 540, 720, 900].forEach(x => {
        scene.add.image(x, y, 'office_desk').setScale(deskScale).setDepth(GAME_CONFIG.DEPTHS.WALLS);
        scene.add.image(x - 16, y + 24, 'office_chair').setScale(chairScale).setDepth(GAME_CONFIG.DEPTHS.WALLS + 1);
      });
    });

    scene.add.image(390, 320, 'office_plant').setScale(plantScale).setDepth(GAME_CONFIG.DEPTHS.WALLS + 1);
    scene.add.image(620, 320, 'office_plant').setScale(plantScale).setDepth(GAME_CONFIG.DEPTHS.WALLS + 1);
    scene.add.image(860, 830, 'office_plant').setScale(plantScale).setDepth(GAME_CONFIG.DEPTHS.WALLS + 1);

    if (scene.textures.exists('office_worker_1')) {
      scene.add.image(270, 460, 'office_worker_1').setScale(workerScale).setDepth(GAME_CONFIG.DEPTHS.PLAYERS - 1);
    }
    if (scene.textures.exists('office_worker_2')) {
      scene.add.image(870, 640, 'office_worker_2').setScale(workerScale).setDepth(GAME_CONFIG.DEPTHS.PLAYERS - 1);
    }
    if (scene.textures.exists('office_worker_4')) {
      scene.add.image(510, 800, 'office_worker_4').setScale(workerScale).setDepth(GAME_CONFIG.DEPTHS.PLAYERS - 1);
    }
  }

  private buildDefault(scene: Phaser.Scene) {
    // Original procedural fallback map (so every space isn't the office).
    const cols = Math.ceil(this.bounds.width / GAME_CONFIG.TILE_SIZE);
    const rows = Math.ceil(this.bounds.height / GAME_CONFIG.TILE_SIZE);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = scene.add.image(
          x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
          y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
          'ground'
        );
        tile.setDepth(GAME_CONFIG.DEPTHS.GROUND);
        if ((x + y) % 2 === 0) tile.setTint(0x1a9e4b);
      }
    }

    // A few random colliders
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(1, cols - 2) * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const y = Phaser.Math.Between(1, rows - 2) * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      this.addRectCollider(x - 16, y - 16, 32, 32);
    }
  }

  getColliders() {
    return this.walls;
  }
}
