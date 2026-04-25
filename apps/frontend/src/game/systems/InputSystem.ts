import Phaser from 'phaser';

export class InputSystem {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: any;

  constructor(scene: Phaser.Scene) {
    if (!scene.input.keyboard) throw new Error("Keyboard plugin not available");
    
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
  }

  getMovementVector(): Phaser.Math.Vector2 {
    const vector = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      vector.x = -1;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      vector.x = 1;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      vector.y = -1;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      vector.y = 1;
    }

    return vector.normalize();
  }
}
