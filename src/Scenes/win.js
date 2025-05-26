class Win extends Phaser.Scene {
    constructor() {
        super("winScene");
    }

    create() {
        this.add.rectangle(720, 450, 1440, 900, 0x000000, 0.7);

        this.add.text(720, 250, "You collected all 5 mega super duper diamonds!", { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

        this.add.text(720, 450, "CONGRATULATIONS YOU WIN!", { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);
        this.add.text(720, 480, `You collected: ${coins} coins!` , { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);


        this.add.text(720, 550, "Press ENTER to restart!", { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.stop("winScene");
            this.scene.start("platformerScene");
        });
    }
}