import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/constants';

export class WorldMap {
  public bounds: Phaser.Geom.Rectangle;
  private walls: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.bounds = new Phaser.Geom.Rectangle(0, 0, width, height);
    scene.physics.world.setBounds(0, 0, width, height);

    // Create ground
    const cols = Math.ceil(width / GAME_CONFIG.TILE_SIZE);
    const rows = Math.ceil(height / GAME_CONFIG.TILE_SIZE);
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = scene.add.image(
          x * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
          y * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2,
          'ground'
        );
        tile.setDepth(GAME_CONFIG.DEPTHS.GROUND);
        // Checkerboard pattern
        if ((x + y) % 2 === 0) tile.setTint(0x1a9e4b);
      }
    }

    // Create some random walls
    this.walls = scene.physics.add.staticGroup();
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(1, cols - 2) * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      const y = Phaser.Math.Between(1, rows - 2) * GAME_CONFIG.TILE_SIZE + GAME_CONFIG.TILE_SIZE / 2;
      
      const wall = this.walls.create(x, y, 'wall');
      wall.setDepth(GAME_CONFIG.DEPTHS.WALLS);
    }
  }

  getColliders() {
    return this.walls;
  }
}
