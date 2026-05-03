import Phaser from 'phaser';

export class OfficePreloadScene extends Phaser.Scene {
  constructor() {
    super('OfficePreloadScene');
  }

  preload() {
    this.load.image('office_desk',         '/free-office-pixel-art/desk.png');
    this.load.image('office_chair',        '/free-office-pixel-art/Chair.png');
    this.load.image('office_plant',        '/free-office-pixel-art/plant.png');
    this.load.image('office_cabinet',      '/free-office-pixel-art/cabinet.png');
    this.load.image('office_printer',      '/free-office-pixel-art/printer.png');
    this.load.image('office_pc1',          '/free-office-pixel-art/PC1.png');
    this.load.image('office_pc2',          '/free-office-pixel-art/PC2.png');
    this.load.image('office_trash',        '/free-office-pixel-art/Trash.png');
    this.load.image('office_sink',         '/free-office-pixel-art/sink.png');
    this.load.image('office_water_cooler', '/free-office-pixel-art/water-cooler.png');
    this.load.image('office_partition1',   '/free-office-pixel-art/office-partitions-1.png');
    this.load.image('office_partition2',   '/free-office-pixel-art/office-partitions-2.png');
    this.load.image('office_writing_table','/free-office-pixel-art/writing-table.png');
    this.load.image('office_coffee_maker', '/free-office-pixel-art/coffee-maker.png');
    this.load.image('office_boss',         '/free-office-pixel-art/boss.png');
    this.load.image('office_desk_with_pc', '/free-office-pixel-art/desk-with-pc.png');
    this.load.image('office_stamping_table','/free-office-pixel-art/stamping-table.png');
    this.load.image('office_worker1',      '/free-office-pixel-art/worker1.png');
    this.load.image('office_worker2',      '/free-office-pixel-art/worker2.png');
    this.load.image('office_worker4',      '/free-office-pixel-art/worker4.png');
  }

  create() {
    this.scene.start('GameScene', { space: 'office' });
  }
}