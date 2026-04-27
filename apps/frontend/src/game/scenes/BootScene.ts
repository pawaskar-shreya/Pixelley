import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load minimal assets here (e.g., loading bar graphics)
  }

  create() {
    this.scene.start('PreloadScene');
  }
}
