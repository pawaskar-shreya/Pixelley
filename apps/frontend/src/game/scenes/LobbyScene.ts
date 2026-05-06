// When player confirms their space choice

let destination;

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super('LobbyScene');
  }

  create() {
    // LobbyScene just sits and waits. It has no space knowledge until the UI calls enterSpace()
  }

  // Called directly by React UI
  public enterSpace(selectedSpace: string) {
    let destination: string;

    switch (selectedSpace) {
      case 'office':
        destination = 'OfficePreloadScene';
        break;

      case 'garden':
        destination = 'GardenPreloadScene';
        break;

      default:
        console.warn('Unknown space selected:', selectedSpace);
        return;
    }

    this.scene.start(destination);
  }
}