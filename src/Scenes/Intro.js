class Intro extends Phaser.Scene {
    constructor() {
        super("introScene");
    }

    preload() {
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }
    
    create() {
        this.map = this.add.tilemap("Level", 18, 18, 80, 80);
        this.tileset = this.map.addTilesetImage("Basic Tiles", "tilemap_tiles");
        this.food_tileset = this.map.addTilesetImage("Food Tiles", "food_tilemap_tiles");
        this.industrial_tileset = this.map.addTilesetImage("Industrial Tiles", "industrial_tilemap_tiles");
        this.backbackgroundLayer = this.map.createLayer("BackBackground", [this.tileset, this.food_tileset, this.industrial_tileset], 0, 0);
        this.paralaxLayer = this.map.createLayer("Paralax", [this.tileset, this.food_tileset, this.industrial_tileset], 0, 0);
        this.wallsLayer = this.map.createLayer("Walls", [this.tileset, this.food_tileset, this.industrial_tileset], 0, 0);
        this.darkOverlay = this.add.rectangle(
            0, 0,
            this.map.widthInPixels,
            this.map.heightInPixels,
            0x000000,
            0.4 // alpha (0 to 1)
        ).setOrigin(0, 0);
        this.backgroundLayer = this.map.createLayer("Background", [this.tileset, this.food_tileset, this.industrial_tileset], 0, 0);
        this.groundLayer = this.map.createLayer("Ground", [this.tileset, this.food_tileset, this.industrial_tileset], 0, 0);
        this.animatedTiles.init(this.map);

        this.add.rectangle(720, 450, 1440, 900, 0x000000, 0.7);

        this.add.text(720, 250, "Collect all 5 Diamonds to win!", { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);

        this.add.text(720, 450, "Josh's Jumpy Jumble", { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5);
        this.add.text(780, 480, "by Joshua Kim-Pearson", { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

        this.add.text(780, 180, "arrow keys to move, space to dash after picking up sushi roll", { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);


        this.add.text(720, 550, "Press ENTER to start!", { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);

        this.input.keyboard.on('keydown-ENTER', () => {
            this.scene.stop("introScene");
            this.scene.start("platformerScene");
        });
    }
}