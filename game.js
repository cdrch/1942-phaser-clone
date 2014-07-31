
BasicGame.Game = function (game) {

};

BasicGame.Game.prototype = {
  
  create: function () {
    this.sea = this.add.tileSprite(0, 0, 1024, 768, 'sea');
    
    this.setupPlayer();
    this.setupEnemies();
    this.setupBullets();
    this.setupExplosions();
    this.setupPlayerIcons();
    this.setupText();
    this.setupAudio();
    
    this.cursors = this.input.keyboard.createCursorKeys();
  },

  update: function () {
    this.sea.tilePosition.y += 0.2;
    
    this.checkCollisions();
    this.spawnEnemies();
    this.enemyFire();
    this.processPlayerInput();
    this.processDelayedEffects();
  },
  
  // create()-related functions
  
  setupPlayer: function () {
    this.player = this.add.sprite(400, 650, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    this.player.animations.add('fly', [ 0, 1, 2 ], 20, true);
    this.player.animations.add('ghost', [ 3, 0, 3, 1 ], 20, true);
    this.player.play('fly');
    this.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.speed = 300;
    this.player.body.collideWorldBounds = true;
    // 20 x 20 pixel hitbox, centered a little bit higher than the center
    this.player.body.setSize(20, 20, 0, -5);
    this.weaponLevel = 0;
    // this.focusLevel = 0;
  },
  
  setupEnemies: function () {
    this.enemyPool = this.add.group();
    this.enemyPool.enableBody = true;
    this.enemyPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyPool.createMultiple(50, 'greenEnemy');
    this.enemyPool.setAll('anchor.x', 0.5);
    this.enemyPool.setAll('anchor.y', 0.5);
    this.enemyPool.setAll('outOfBoundsKill', true);
    this.enemyPool.setAll('checkWorldBounds', true);
    this.enemyPool.setAll('reward', 100, false, false, 0, true);
    this.enemyPool.setAll('dropRate', 0.3, false, false, 0, true);
    
    // Set the animation for each sprite
    this.enemyPool.forEach(function (enemy) {
      enemy.animations.add('fly', [ 0, 1, 2 ], 20, true);
      enemy.animations.add('hit', [ 3, 1, 3, 2 ], 20, false);
      enemy.events.onAnimationComplete.add( function (e) {
        e.play('fly');
      }, this);
    });
    
    this.nextEnemyAt = 0;
    this.enemyDelay = 1000;
    this.enemyInitialHealth = 2;
    
    this.shooterPool = this.add.group();
    this.shooterPool.enableBody = true;
    this.shooterPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.shooterPool.createMultiple(50, 'whiteEnemy');
    this.shooterPool.setAll('anchor.x', 0.5);
    this.shooterPool.setAll('anchor.y', 0.5);
    this.shooterPool.setAll('outOfBoundsKill', true);
    this.shooterPool.setAll('checkWorldBounds', true);
    this.shooterPool.setAll('reward', 400, false, false, 0, true);
    this.shooterPool.setAll('dropRate', 0.5, false, false, 0, true);
    
    // Set the animation for each sprite
    this.shooterPool.forEach(function (enemy) {
      enemy.animations.add('fly', [ 0, 1, 2 ], 20, true);
      enemy.animations.add('hit', [ 3, 1, 3, 2 ], 20, false);
      enemy.events.onAnimationComplete.add( function (e) {
        e.play('fly');
      }, this);
    });
    
    // start spawning shooters 5 seconds after game start
    this.nextShooterAt = this.time.now + 5000;
    this.shooterDelay = 3000
    this.shooterShotDelay = 2000;
    this.shooterInitialHealth = 5;
    
    this.bossPool = this.add.group();
    this.bossPool.enableBody = true;
    this.bossPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.bossPool.createMultiple(1, 'boss');
    this.bossPool.setAll('anchor.x', 0.5);
    this.bossPool.setAll('anchor.y', 0.5);
    this.bossPool.setAll('outOfBoundsKill', true);
    this.bossPool.setAll('checkWorldBounds', true);
    this.bossPool.setAll('reward', 10000, false, false, 0, true);
    this.bossPool.setAll('dropRate', 0, false, false, 0, true);
    
    // Set the animation for each sprite
    this.bossPool.forEach(function (enemy) {
      enemy.animations.add('fly', [ 0, 1, 2 ], 20, true);
      enemy.animations.add('hit', [ 3, 1, 3, 2 ], 20, false);
      enemy.events.onAnimationComplete.add( function (e) {
        e.play('fly');
      }, this);
    });
    
    this.boss = this.bossPool.getTop();
    this.bossApproaching = false;
    this.bossInitialHealth = 500;
  },
  
  setupBullets: function () {
    this.enemyBulletPool = this.add.group();
    this.enemyBulletPool.enableBody = true;
    this.enemyBulletPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.enemyBulletPool.createMultiple(100, 'enemyBullet');
    this.enemyBulletPool.setAll('anchor.x', 0.5);
    this.enemyBulletPool.setAll('anchor.y', 0.5);
    this.enemyBulletPool.setAll('outOfBoundsKill', true);
    this.enemyBulletPool.setAll('checkWorldBounds', true);
    this.enemyBulletPool.setAll('reward', 0, false, false, 0, true);
    
    // Add an empty sprite group
    this.bulletPool = this.add.group()
    
    // Enables physics to the whole group
    this.bulletPool.enableBody = true;
    this.bulletPool.physicsBodyType = Phaser.Physics.ARCADE;
    
    // Add 100 'bullet' sprites in the group.
    // By default this uses the first frame of the sprite sheet and
    //   sets the initial state as non-existing (i.e. killed/dead)
    this.bulletPool.createMultiple(100, 'bullet');
    
    // Sets anchors of all sprites
    this.bulletPool.setAll('anchor.x', 0.5);
    this.bulletPool.setAll('anchor.y', 0.5);
    
    // Automantically kill the bullet sprites when they go out of bounds
    this.bulletPool.setAll('outOfBoundsKill', true);
    this.bulletPool.setAll('checkWorldBounds', true);
    
    this.nextShotAt = 0;
    this.shotDelay = 100;
    
    this.bombPool = this.add.group();
    this.bombPool.enableBody = true;
    this.bombPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.bombPool.createMultiple(3, 'bombBlast');
    this.bombPool.setAll('anchor.x', 0.0);
    this.bombPool.setAll('anchor.y', 0.0);
    this.bombPool.setAll('reward', 0, false, false, 0, true);
  },
  
  setupExplosions: function () {
    this.explosionPool = this.add.group();
    this.explosionPool.enableBody = true;
    this.explosionPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.explosionPool.createMultiple(100, 'explosion');
    this.explosionPool.setAll('anchor.x', 0.5);
    this.explosionPool.setAll('anchor.y', 0.5);
    this.explosionPool.forEach(function (explosion) {
      explosion.animations.add('boom');
    });
  },
  
  setupPlayerIcons: function () {
    this.powerUpPool = this.add.group();
    this.powerUpPool.enableBody = true;
    this.powerUpPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.powerUpPool.createMultiple(5, 'powerup1');
    this.powerUpPool.setAll('anchor.x', 0.5);
    this.powerUpPool.setAll('anchor.y', 0.5);
    this.powerUpPool.setAll('outOfBoundsKill', true);
    this.powerUpPool.setAll('checkWorldBounds', true);
    this.powerUpPool.setAll('reward', 100, false, false, 0, true);
    
    // this.focusUpPool = this.add.group();
    // this.focusUpPool.enableBody = true;
    // this.focusUpPool.physicsBodyType = Phaser.Physics.ARCADE;
    // this.focusUpPool.createMultiple(5, 'powerup2');
    // this.focusUpPool.setAll('anchor.x', 0.5);
    // this.focusUpPool.setAll('anchor.y', 0.5);
    // this.focusUpPool.setAll('outOfBoundsKill', true);
    // this.focusUpPool.setAll('checkWorldBounds', true);
    // this.focusUpPool.setAll('reward', 100, false, false, 0, true);
    
    this.lives = this.add.group();
    for (var i = 0; i < 3; i++) {
      var life = this.lives.create(924 + (30 * i), 30, 'player');
      life.scale.setTo(0.5, 0.5);
      life.anchor.setTo(0.5, 0.5);
    }
    
    this.bombs = this.add.group();
    for (var i = 0; i < 3; i++) {
      var bomb = this.bombs.create(30 + (30 * i), 30, 'bomb');
      bomb.scale.setTo(1, 1);
      bomb.anchor.setTo(0.5, 0.5);
    }
  },
  
  setupText: function () {
    // Create instructions
    this.instructions = this.add.text( 510, 600,
      'Use Arrow Keys to Move, Press Z to Fire\n' +
      'Tapping/clicking does both',
      {font: '20px monospace', fill: '#fff', align: 'center' }
    );
    this.instructions.anchor.setTo(0.5, 0.5);
    this.instExpire = this.time.now + 10000;
    
    this.score = 0;
    this.scoreText = this.add.text(
      510, 30, '' + this.score,
      { font: '20px monospace', fill: '#fff', align: 'center' }
    );
    this.scoreText.anchor.setTo(0.5, 0.5);
  },
  
  setupAudio: function () {
    this.explosionSFX = this.add.audio('explosion');
    this.playerExplosionSFX = this.add.audio('playerExplosion');
    this.enemyFireSFX = this.add.audio('enemyFire');
    this.playerFireSFX = this.add.audio('playerFire');
    this.powerUpSFX = this.add.audio('powerUp');
  },
  
  // update()-related functions
  
  checkCollisions: function () {
    this.physics.arcade.overlap(
      this.bulletPool, this.enemyPool, this.enemyHit, null, this
    );
    
    this.physics.arcade.overlap(
      this.bulletPool, this.shooterPool, this.enemyHit, null, this
    );
    
    this.physics.arcade.overlap(
      this.player, this.enemyPool, this.playerHit, null, this
    );
    
    this.physics.arcade.overlap(
      this.player, this.shooterPool, this.playerHit, null, this
    );
    
    this.physics.arcade.overlap(
      this.player, this.enemyBulletPool, this.playerHit, null, this
    );
    
    this.physics.arcade.overlap(
      this.player, this.powerUpPool, this.playerPowerUp, null, this
    );
    
    // this.physics.arcade.overlap(
    //   this.player, this.focusUpPool, this.playerFocusUp, null, this
    // );
    
    this.physics.arcade.overlap(
      this.bombPool, this.enemyPool, this.bombHit, null, this
    );
    
    this.physics.arcade.overlap(
      this.bombPool, this.shooterPool, this.bombHit, null, this
    );
    
    this.physics.arcade.overlap(
      this.bombPool, this.enemyBulletPool, this.destroyEnemyBullets, null, this
    );
    
    if (this.bossApproaching === false) {
      this.physics.arcade.overlap(
        this.bulletPool, this.bossPool, this.enemyHit, null, this
      );
      
      this.physics.arcade.overlap(
        this.player, this.bossPool, this.playerHit, null, this
      );
      
      this.physics.arcade.overlap(
      this.bombPool, this.bossPool, this.bombHit, null, this
    );
    }
  },
  
  spawnEnemies: function () {
    if (this.nextEnemyAt < this.time.now && this.enemyPool.countDead() > 0) {
      this.nextEnemyAt = this.time.now + this.enemyDelay;
      var enemy = this.enemyPool.getFirstExists(false);
      // spawn at a random location above screen
      enemy.reset(this.rnd.integerInRange(20, 1004), 0, this.enemyInitialHealth);
      // also randomize the speed
      enemy.body.velocity.y = this.rnd.integerInRange(30, 60);
      enemy.play('fly');
    }
    
    if (this.nextShooterAt < this.time.now && this.shooterPool.countDead() > 0) {
      this.nextShooterAt = this.time.now + this.shooterDelay;
      var shooter = this.shooterPool.getFirstExists(false);
      
      // spawn at a random location at the top
      shooter.reset(this.rnd.integerInRange(20, 1004), 0, this.shooterInitialHealth);
      
      // choose a random target location at the bottom
      var target = this.rnd.integerInRange(20, 1004);
      
      // move to target and rotate the sprite accordingly (note the added PI/2 radians)
      shooter.rotation = this.physics.arcade.moveToXY(
        shooter, target, 768, this.rnd.integerInRange(30, 80)
        ) - Math.PI / 2;
      shooter.play('fly');
      
      // each shooter has this own shot timer
      shooter.nextShotAt = 0;
    }
  },
  
  processPlayerInput: function () {
    this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;
    
    // begin DEBUG commands
    // if (this.input.keyboard.isDown(Phaser.Keyboard.Q)) {
    //   this.addToScore(19999);
    // }
    
    // if (this.input.keyboard.isDown(Phaser.Keyboard.F)) {
    //   if (this.focusLevel === 1) {
    //     this.focusLevel = 0;
    //   } else {
    //     this.focusLevel = 1;
    //   }
    // }
    // end DEBUG commands
    
    if (this.cursors.left.isDown) {
      this.player.body.velocity.x = -this.player.speed;
    } else if (this.cursors.right.isDown) {
      this.player.body.velocity.x = this.player.speed;
    }
    
    if (this.cursors.up.isDown) {
      this.player.body.velocity.y = -this.player.speed;
    } else if (this.cursors.down.isDown) {
      this.player.body.velocity.y = this.player.speed;
    }
    
    if (this.input.activePointer.isDown &&
        this.physics.arcade.distanceToPointer(this.player) > 15) {
      this.physics.arcade.moveToPointer(this.player, this.player.speed);
    }
    
    if (this.input.keyboard.isDown(Phaser.Keyboard.Z) ||
        this.input.activePointer.isDown) {
      if (this.returnText && this.returnText.exists) {
        this.quitGame();
      } else {
        this.fire();
      }
    }
    
    if (this.input.keyboard.isDown(Phaser.Keyboard.X)) {
      if (this.bombs.length === 0) {
        return;
      } else {
        this.dropBomb();
      }
    }
  },
  
  processDelayedEffects: function () {
    if (this.instructions.exists && this.time.now > this.instExpire) {
      this.instructions.destroy();
    }
    
    if (this.bombExpire && this.bombExpire < this.time.now) {
      this.bombExpire = null;
      this.currentBomb.destroy();
      this.currentBomb = null;
    }
    
    if (this.ghostUntil && this.ghostUntil < this.time.now) {
      this.ghostUntil = null;
      this.player.play('fly');
    }
    
    if (this.showReturn && this.time.now > this.showReturn) {
      this.returnText = this.add.text(
        512, 400,
        'Press Z or Tap Game to go back to Main Menu',
        { font: '16 px sans-serif', fill: '#fff' }
        );
        this.returnText.anchor.setTo(0.5, 0.5);
        this.showReturn = false;
    }
    
    if (this.bossApproaching && this.boss.y > 80) {
      this.bossApproaching = false;
      this.boss.health = 500;
      this.boss.nextShotAt = 0;
      
      this.boss.body.velocity.y = 0;
      this.boss.body.velocity.x = 200;
      // allow bouncing off world bounds
      this.boss.body.bounce.x = 1;
      this.boss.body.collideWorldBounds = true;
    }
  },
  
  enemyHit: function (bullet, enemy) {
    bullet.kill();
    this.damageEnemy(enemy, 1);
  },
  
  bombHit: function (bomb, enemy) {
    this.damageEnemy(enemy, 0.0167);
  },
  
  destroyEnemyBullets: function (bomb, bullet) {
    bullet.kill();
  },
  
  playerHit: function (player, enemy) {
    if (this.ghostUntil && this.ghostUntil > this.time.now) {
      return;
    }
    
    this.playerExplosionSFX.play();
    
    // crashing into an enemy only deals 5 damage
    this.damageEnemy(enemy, 5);
    var life = this.lives.getFirstAlive();
    if (life) {
      life.kill();
      this.weaponLevel = 0;
      //this.focusLevel = 0;
      this.ghostUntil = this.time.now + 3000;
      this.player.play('ghost');
    } else {
      this.explode(player);
      player.kill();
      this.displayEnd(false);
    }
  },
  
  damageEnemy: function (enemy, damage) {
    enemy.damage(damage);
    if (enemy.alive) {
      enemy.play('hit');
    } else {
      this.explode(enemy);
      this.explosionSFX.play();
      this.spawnPowerUp(enemy);
      this.addToScore(enemy.reward);
      if (enemy.key === 'boss') {
        this.enemyPool.destroy();
        this.shooterPool.destroy();
        this.bossPool.destroy();
        this.enemyBulletPool.destroy();
        this.displayEnd(true);
      }
    }
  },
  
  addToScore: function (score) {
    this.score += score;
    this.scoreText.text = this.score;
    // if (this.score < 2000) {
    //   this.currentPhase = 1;
    //   this.enemyDelay = 1000;
    //   this.shooterSpawning = false;
    //   this.shooterDelay = 3000;
    // } else if (this.score >= 2000) {
    //   this.currentPhase = 2;
    //   this.enemyDelay = 800;
    //   this.shooterSpawning = true;
    //   this.shooterDelay = 3000;
    // } else if (this.score >= 5000) {
    //   this.currentPhase = 3;
    //   this.enemyDelay = 600;
    //   this.shooterSpawning = true;
    //   this.shooterDelay = 2500;
    // } else if (this.score >= 10000) {
    //   this.currentPhase = 4;
    //   this.enemyDelay = 500;
    //   this.shooterSpawning = true;
    //   this.shooterDelay = 200;
    // } else if (this.score >= 17500) {
    //   this.currentPhase = 5;
    //   this.enemyDelay = 300;
    //   this.shooterSpawning = true;
    //   this.shooterDelay = 1500;
    // } else if (this.score >= 25000 && this.bossPool.countDead() == 1) {
    //   this.currentPhase = 6;
    //   this.enemyDelay = 600;
    //   this.shooterSpawning = false;
    //   this.shooterDelay = 3000;
    //   this.spawnBoss();
    // }
    
    if (this.score >= 20000 && this.bossPool.countDead() == 1) {
      this.spawnBoss();
    }
  },
  
  spawnBoss: function () {
    this.bossApproaching = true;
    this.boss.reset(512, 0, this.bossInitialHealth);
    this.physics.enable(this.boss, Phaser.Physics.ARCADE);
    this.boss.body.velocity.y = 15;
    this.boss.play('fly');
  },
  
  spawnPowerUp: function (enemy) {
    if (true) {
      if (this.powerUpPool.countDead () === 0 || this.weaponLevel === 5) {
        return;
      }
      
      if (this.rnd.frac() < enemy.dropRate) {
        var powerUp = this.powerUpPool.getFirstExists(false);
        powerUp.reset(enemy.x, enemy.y);
        powerUp.body.velocity.y = 100;
      }
    } 
    // else {
    //   if (this.focusUpPool.countDead () === 0 || this.focusLevel === 1) {
    //     return;
    //   }
      
    //   if (this.rnd.frac() < enemy.dropRate) {
    //     var focusUp = this.focusUpPool.getFirstExists(false);
    //     focusUp.reset(enemy.x, enemy.y);
    //     focusUp.body.velocity.y = 100;
    //   }
    // }
  },
  
  playerPowerUp: function (player, powerUp) {
    this.addToScore(powerUp.reward);
    powerUp.kill();
    this.powerUpSFX.play();
    if (this.weaponLevel < 5) {
      this.weaponLevel++;
    }
  },
  
  // playerFocusUp: function (player, focusUp) {
  //   this.addToScore(focusUp.reward);
  //   focusUp.kill();
  //   this.powerUpSFX.play();
  //   if (this.focusLevel < 1) {
  //     this.focusLevel++;
  //   }
  // },
  
  explode: function(sprite) {
    if (this.explosionPool.countDead() === 0) {
      return;
    }
    var explosion = this.explosionPool.getFirstExists(false);
    explosion.reset(sprite.x, sprite.y);
    explosion.play('boom', 15, false, true);
    // add the original sprite's velocity to the explosion
    explosion.body.velocity.x = sprite.body.velocity.x;
    explosion.body.velocity.y = sprite.body.velocity.y;
  },
  
  enemyFire: function () {
    this.shooterPool.forEachAlive(function (enemy) {
      if (this.time.now > enemy.nextShotAt && this.enemyBulletPool.countDead() > 0) {
        var bullet = this.enemyBulletPool.getFirstExists(false);
        bullet.reset(enemy.x, enemy.y);
        this.physics.arcade.moveToObject(bullet, this.player, 150);
        enemy.nextShotAt = this.time.now + this.shooterShotDelay;
        this.enemyFireSFX.play();
      }
    }, this);
    
    if (this.bossApproaching === false && this.boss.alive &&
        this.boss.nextShotAt < this.time.now &&
        this.enemyBulletPool.countDead() > 9) {
          
      this.boss.nextShotAt = this.time.now + 1000;
      this.enemyFireSFX.play();
      
      for (var i = 0; i < 5; i++) {
        // process 2 bullets at a time
        var leftBullet = this.enemyBulletPool.getFirstExists(false);
        leftBullet.reset(this.boss.x - 10 - i * 10, this.boss.y + 20);
        var rightBullet = this.enemyBulletPool.getFirstExists(false);
        rightBullet.reset(this.boss.x + 10 + i * 10, this.boss.y + 20);
        
        if (this.boss.health > 250) {
          // aim directly at player
          this.physics.arcade.moveToObject(leftBullet, this.player, 150);
          this.physics.arcade.moveToObject(rightBullet, this.player, 150);
        } else {
          // aim slightly off center of the player
          this.physics.arcade.moveToXY(
            leftBullet, this.player.x - i * 100, this.player.y, 150
          );
          this.physics.arcade.moveToXY(
            rightBullet, this.player.x + i * 100, this.player.y, 150
          );
        }
      }
    }
  },
  
  fire: function() {
    if (!this.player.alive || this.nextShotAt > this.time.now) {
      return;
    }
    this.focusLevel = 1;
    
    this.nextShotAt = this.time.now + this.shotDelay;
    this.playerFireSFX.play();
    
    var bullet;
    if (this.weaponLevel === 0) {
      if (this.bulletPool.countDead() === 0) {
        return;
      }
      bullet = this.bulletPool.getFirstExists(false);
      bullet.reset(this.player.x, this.player.y - 20);
      bullet.body.velocity.y = -500;
    } 
    else {
      if (this.bulletPool.countDead() < this.weaponLevel * 2) {
        return;
      }
      for (var i = 0; i < this.weaponLevel; i++) {
        bullet = this.bulletPool.getFirstExists(false);
        // spawn left bullet slightly left off center
        bullet.reset(this.player.x - (10 + i * 6), this.player.y - 20);
        // the left bullets spread from -95 degrees to -135 degrees
        this.physics.arcade.velocityFromAngle(
        -95 - i * 10, 500, bullet.body.velocity
        );
        
        
        bullet = this.bulletPool.getFirstExists (false);
        // spawn right bullet slightly right off center
        bullet.reset(this.player.x + (10 + i * 6), this.player.y - 20);
        // the right bullets spread from -85 degrees to -45
        this.physics.arcade.velocityFromAngle(
          -85 + i * 10, 500, bullet.body.velocity
        );
      }
    }
  },
  
  dropBomb: function () {
    if (!this.player.alive || this.nextBombAt > this.time.now) {
      return;
    }
    
    
    
    var bombReady = this.bombs.getFirstAlive();
    if (bombReady) {
      bombReady.kill();
      this.nextBombAt = this.time.now + 6000;
      // TODO: bomb SFX
      
      var bomb = this.bombPool.getFirstExists(false);
      this.currentBomb = bomb;
      // cover the screen
      bomb.reset(0, 0);
      // TODO: animation?
      
      this.bombExpire = this.time.now + 3000;
    }
  },
  
  displayEnd: function (win) {
    // you can't win and lose at the same time
    if (this.endText && this.endText.exists) {
      return;
    }
    
    var msg = win ? 'You Win!!!' : 'Game Over!';
    this.endText = this.add.text(
      510, 320, msg,
      { font: '72px serif', fill: '#fff' }
    );
    this.endText.anchor.setTo(0.5, 0);
    this.showReturn = this.time.now + 2000;
  },
  
  render: function () {
    //this.game.debug.body(this.player);
  },

  quitGame: function (pointer) {

    //  Here you should destroy anything you no longer need.
    //  Stop music, delete sprites, purge caches, free resources, all that good stuff.
    this.sea.destroy();
    this.player.destroy();
    this.enemyPool.destroy();
    this.bulletPool.destroy();
    this.bombPool.destroy();
    this.explosionPool.destroy();
    this.shooterPool.destroy();
    this.enemyBulletPool.destroy();
    this.powerUpPool.destroy();
    this.bossPool.destroy();
    this.instructions.destroy();
    this.scoreText.destroy();
    this.endText.destroy();
    this.returnText.destroy();
    //  Then let's go back to the main menu.
    this.state.start('MainMenu');

  }

};
