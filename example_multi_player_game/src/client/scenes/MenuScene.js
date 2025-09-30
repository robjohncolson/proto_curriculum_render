import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Load any menu assets if needed
    }

    create() {
        this.gameManager = this.registry.get('gameManager');
        this.networkManager = this.registry.get('networkManager');

        // Menu is handled by HTML/CSS, so we just transition to lobby
        this.time.delayedCall(100, () => {
            this.scene.start('LobbyScene');
        });
    }
}