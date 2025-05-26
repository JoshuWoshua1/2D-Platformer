class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 2000;
        this.DRAG = 4000;    // DRAG < ACCELERATION = icy slide
        this.MAX_SPEED = 200;
        this.MAX_FALL_SPEED = 800;
        this.physics.world.gravity.y = 1500;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 2.0;
        this.JUMP_VELOCITY = -100;
        this.isJumping = false;
        this.jumpTimer = 0;
        this.MAX_JUMP_TIME = 200; // in milliseconds
        this.HOLD_JUMP_VELOCITY = -300; // continuous upward force while holding

        this.DASH_SPEED = -1000;
        this.DASH_DURATION = 100;  // in milliseconds
        this.DASH_COOLDOWN = 500;  // in milliseconds

        this.isDashing = false;
        this.dashTimer = 0;
        this.lastDash = 0;
        this.dashUnlock = true;  // false by default ONLY TRUE FOR DEBUG <---------------------------------------------**************

        this.jumpCount = 0;
        this.MAX_JUMPS = 2;  // 1 by default ONLY 2 FOR DEBUG <---------------------------------------------**************
    }

    create() {
        //load audio
        this.coinSound = this.sound.add("coin");
        this.diamondSound = this.sound.add("diamond");
        this.jumpSound = this.sound.add("jump");
        this.dashSound = this.sound.add("dash");
        this.powerUpSound = this.sound.add("powerUp");
        this.deathSound = this.sound.add("death")

        // Create a new tilemap game object which uses 18x18 pixel tiles, and is 80 tiles wide and 80 tiles tall.
        this.map = this.add.tilemap("Level", 18, 18, 80, 80);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // First parameter: name we gave the tileset in Tiled |||| Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("Basic Tiles", "tilemap_tiles");
        this.food_tileset = this.map.addTilesetImage("Food Tiles", "food_tilemap_tiles");
        this.industrial_tileset = this.map.addTilesetImage("Industrial Tiles", "industrial_tilemap_tiles");

        // tilemap layers
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

        // collision for ground layer
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        //creating objects (coins, diamonds, and power up foods)
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        this.diamonds = this.map.createFromObjects("Objects", {
            name: "diamond",
            key: "tilemap_sheet",
            frame: 67
        });
        this.dashRoll = this.map.createFromObjects("Objects", {
            name: "dashroll",
            key: "food_tilemap_sheet",
            frame: 103
        });
        this.jumpSushi = this.map.createFromObjects("Objects", {
            name: "jumpsushi",
            key: "food_tilemap_sheet",
            frame: 104
        });
        this.spikes = this.map.createFromObjects("Objects", {
            name: "spike",
            key: "tilemap_sheet",
            frame: 68
        });

        // give the objects arcade physics
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.diamonds, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.dashRoll, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.jumpSushi, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.spikes, Phaser.Physics.Arcade.STATIC_BODY);

        // Collision groups for multiple objects (like coins & diamonds)
        this.coinGroup = this.add.group(this.coins);
        this.diamondGroup = this.add.group(this.diamonds);
        this.spikeGroup = this.add.group(this.spikes);

        //change hitbox for spikes
        this.spikeGroup.getChildren().forEach(spike => {
            const flipdX = spike.flipX;
            const flipdY = spike.flipY;
            let wid = 18; let hei = 9; let offX = 0; let offY = 9;
            if (flipdX) {
                offX = spike.width - wid - offX;
            }
            if (flipdY) {
                offY = spike.height - hei - offY;
            }
            spike.body.setSize(wid, hei);
            spike.body.setOffset(offX, offY);
        });

        // player setup
        my.sprite.player = this.physics.add.sprite(100, 900, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);
        this.physics.world.TILE_BIAS = 20;

        // Collision with ground
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // Collision with objects
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
            this.coinSound.play({
                volume: 0.4,
            });
        }); 
        this.physics.add.overlap(my.sprite.player, this.diamondGroup, (obj1, obj2) => {
            obj2.destroy(); // remove diamond on overlap
            this.diamondSound.play({
                volume: 0.8,
            });
        }); 
        this.physics.add.overlap(my.sprite.player, this.dashRoll, (obj1, obj2) => {
            this.dashUnlock = true; // unlocks dash
            obj2.destroy(); // remove food on overlap
            this.powerUpSound.play({
                volume: 0.6,
            });
        }); 
        this.physics.add.overlap(my.sprite.player, this.jumpSushi, (obj1, obj2) => {
            this.MAX_JUMPS = 2; // unlocks double jumping
            obj2.destroy(); // remove food on overlap
            this.powerUpSound.play({
                volume: 0.6,
            });
        }); 
        this.physics.add.overlap(my.sprite.player, this.spikeGroup, (obj1, obj2) => {
            // ADD SCREEN TEXT AND MORE TO SAY "YOU DIED"
            this.deathSound.play();
            this.cameras.main.stopFollow();
            my.sprite.player.setVisible(false);
            my.sprite.player.body.enable = false;
            my.vfx.death.emitParticleAt(
                my.sprite.player.x,
                my.sprite.player.y,
            );
            this.cameras.main.shake(200, 0.01);

            this.time.delayedCall(1500, () => {
                this.scene.restart();
            });
        }); 

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey = this.input.keyboard.addKey('R');
        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        my.vfx.walking = this.add.particles(0, 5, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_02.png', 'smoke_03.png'],
            random: true,
            scale: {start: 0.01, end: 0.08},
            maxAliveParticles: 20,
            lifespan: 200,
            alpha: {start: 0.7, end: 0.1}, 
        }); my.vfx.walking.stop();

        my.vfx.jump = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_02.png', 'smoke_03.png'],
            random: true,
            scale: {start: 0.08, end: 0.08},
            lifespan: 500,
            alpha: {start: 0.7, end: 0.1}, 
            speedX: { min: -50, max: 50 },
            quantity: 20
        }); my.vfx.jump.stop();

        my.vfx.dash = this.add.particles(0, 0, "kenny-particles", {
            frame: ['flare_01.png'],
            scale: {start: 0.52, end: 0.05},
            lifespan: 200,
            alpha: {start: 0.4, end: 0}, 
        }); my.vfx.dash.stop();

        my.vfx.death = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_02.png', 'smoke_03.png'],
            random: true,
            speed: { min: -200, max: 200 },
            scale: { start: 0.1, end: 0.05 },
            lifespan: 600,
            quantity: 40,
            alpha: { start: 1, end: 0 },
        }); my.vfx.death.stop();
        
        // camera setup
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(100, 300);
        this.cameras.main.setZoom(this.SCALE);

    }

    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            } else {
                my.vfx.walking.stop();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            } else {
                my.vfx.walking.stop();
            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();

        }

        // jump count reset
        if (my.sprite.player.body.blocked.down) {
            this.jumpCount = 0; // reset jumps when on the ground
        }

        if (my.sprite.player.body.blocked.down) {
            this.jumpCount = 0;
        } else if (this.jumpCount === 0) {
            this.jumpCount = 1; // start with 1 if player walked off a ledge
        }

        // Start jump
        if (Phaser.Input.Keyboard.JustDown(cursors.up) && this.jumpCount < this.MAX_JUMPS) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY); // Initial burst
            this.isJumping = true;
            this.jumpTimer = 0;
            this.jumpCount++;
            this.jumpSound.play({
                volume: 0.8,
            });
            my.vfx.jump.emitParticleAt(
                my.sprite.player.x,
                my.sprite.player.y + my.sprite.player.displayHeight / 2  // emit below feet
            );
        }

        // While holding jump
        if (this.isJumping && cursors.up.isDown) {
            this.jumpTimer += this.game.loop.delta;

            if (this.jumpTimer < this.MAX_JUMP_TIME) {
                my.sprite.player.body.setVelocityY(this.HOLD_JUMP_VELOCITY); // keep boosting upward
            }
        }

        // Stop jump after cursor release, or ceiling hit, or max jump time
        if (Phaser.Input.Keyboard.JustUp(cursors.up) || my.sprite.player.body.blocked.up || this.jumpTimer >= this.MAX_JUMP_TIME) {
            this.isJumping = false;
        }

        //maxspeed limiter X
        if (!this.isDashing) {
            if (Math.abs(my.sprite.player.body.velocity.x) > this.MAX_SPEED) {
                my.sprite.player.body.velocity.x = Phaser.Math.Clamp(my.sprite.player.body.velocity.x, -this.MAX_SPEED, this.MAX_SPEED);
            }
        }
        //maxspeed limiter Y
        if (Math.abs(my.sprite.player.body.velocity.y) > this.MAX_FALL_SPEED) {
            my.sprite.player.body.velocity.y = Phaser.Math.Clamp(my.sprite.player.body.velocity.y, -this.MAX_FALL_SPEED, this.MAX_FALL_SPEED);
        }

        //dashing
        const now = this.time.now;
        // Start dash if space is pressed, player is not already dashing, and cooldown passed
        if (this.dashUnlock == true && Phaser.Input.Keyboard.JustDown(this.spaceKey) && !this.isDashing && now - this.lastDash > this.DASH_COOLDOWN) {
            this.isDashing = true;
            this.dashTimer = 0;
            this.lastDash = now;

            //audio
            this.dashSound.play({
                volume: 0.8,
            });
            //vfx
            my.vfx.dash.startFollow(
                my.sprite.player,
                my.sprite.player.displayWidth / 2 * -1, // offset to appear behind
                0,
                false
            );
            my.vfx.dash.start();

            // Disable gravity
            my.sprite.player.body.allowGravity = false;
            // Set dash velocity based on facing direction
            const direction = my.sprite.player.flipX ? -1 : 1;
            my.sprite.player.setVelocityX(this.DASH_SPEED * direction);
        }

        // During dash
        if (this.isDashing) {
            this.dashTimer += this.game.loop.delta;
            my.sprite.player.setVelocityY(0)
            this.isJumping = false;

            if (this.dashTimer >= this.DASH_DURATION) {
                this.isDashing = false;
                my.sprite.player.body.allowGravity = true;
                my.vfx.dash.stop();
            }
        }
    }
}