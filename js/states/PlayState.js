import Hero from '../entities/Hero.js'
import Spider from '../entities/Spider.js'
import Boss from '../entities/Boss.js'
import Constants from '../config/constants.js'

/**
 * PlayState - основний стан гри, який керує ігровим процесом
 * Відповідає за:
 * - Завантаження ресурсів (спрайти, звуки, рівні)
 * - Створення та управління ігровими об'єктами
 * - Обробку колізій між об'єктами
 * - Керування станом гри (очки, ключі, двері)
 */

export default {
    /**
     * Ініціалізація стану гри
     * @param {Object} data - Параметри ініціалізації (рівень гри)
     */
    init: function (data) {
        console.log('Init PlayState with data:', data)
        this.level = (data.level || 0) % Constants.LEVEL_COUNT
        console.log('Current level:', this.level)
        
        this.game.renderer.renderSession.roundPixels = true
        this.keys = this.game.input.keyboard.addKeys({
            left: Phaser.KeyCode.LEFT,
            right: Phaser.KeyCode.RIGHT,
            up: Phaser.KeyCode.UP,
            throw: Phaser.KeyCode.ENTER
        })
        
        this.coinPickupCount = 0
        this.hasKey = false
        this.doorIsAnimating = false
        this._throwCooldown = false
        
        this.keys.up.onDown.add(function () {
            let didJump = this.hero.jump()
            if (didJump) {
                this.sfx.jump.play()
            }
        }, this)
        
        // Додаємо обробник для кидання бомб
        this.keys.throw.onDown.add(function () {
            if (!this._throwCooldown) {
                this.sfx.bomb_throw.play()  // Додаємо звук кидання бомби
                this.hero.throwBombs()
                this._throwCooldown = true
                this.game.time.events.add(500, () => {
                    this._throwCooldown = false
                })
            }
        }, this)
    },

    /**
     * Завантаження всіх ігрових ресурсів
     * Спрайти, звуки, рівні, зображення
     */
    preload: function () {
        // Завантажуємо JSON рівня
        const levelNumber = this.level < 10 ? '0' + this.level : this.level
        this.game.load.json(`level:${this.level}`, `data/level${levelNumber}.json`)
        console.log('Loading level file:', `data/level${levelNumber}.json`)
        
        this.game.load.image('background', 'images/background.png')
        this.game.load.image('ground', 'images/ground.png')
        this.game.load.image('grass:8x1', 'images/grass_8x1.png')
        this.game.load.image('grass:6x1', 'images/grass_6x1.png')
        this.game.load.image('grass:4x1', 'images/grass_4x1.png')
        this.game.load.image('grass:2x1', 'images/grass_2x1.png')
        this.game.load.image('grass:1x1', 'images/grass_1x1.png')
        this.game.load.image('invisible-wall', 'images/invisible_wall.png')
        this.game.load.image('icon:coin', 'images/coin_icon.png')
        this.game.load.image('font:numbers', 'images/numbers.png')
        this.game.load.image('key', 'images/key.png')
        this.game.load.spritesheet('icon:key', 'images/key_icon.png', 34, 30)
        this.game.load.image('bomb', 'images/bomb2.png')
        
        this.game.load.spritesheet('coin', 'images/coin_animated.png', 22, 22)
        this.game.load.spritesheet('spider', 'images/spider.png', 42, 32)
        this.game.load.spritesheet('hero', 'images/hero2.png', 36, 42)
        this.game.load.spritesheet('door', 'images/door.png', 42, 66)
        this.game.load.spritesheet('boss', 'images/spider_boss.png', 32, 32)
        this.game.load.spritesheet('explode', 'images/explode.png', 64, 42)  // Ширина одного кадру 64px (960/15)
        
        this.game.load.audio('sfx:jump', 'audio/wet-fart-meme.mp3')
        this.game.load.audio('sfx:coin', 'audio/coin2.mp3')
        this.game.load.audio('sfx:stomp', 'audio/stomp.mp3')
        this.game.load.audio('sfx:stomp2', 'audio/stomp2.mp3')
        this.game.load.audio('sfx:key', 'audio/key.mp3')
        this.game.load.audio('sfx:door', 'audio/door.mp3')
        this.game.load.audio('sfx:bomb_throw', 'audio/bomb_throw.mp3')
        this.game.load.audio('sfx:pluh', 'audio/pluh.mp3')
        
        // Завантажуємо музику
        this.game.load.audio('bgm', ['audio/bgm.mp3', 'audio/bgm.ogg'])
    },
    
    /**
     * Створення ігрового світу
     * Викликається після завантаження всіх ресурсів
     */
    create: function () {
        // Налаштовуємо фізику
        this.game.physics.arcade.gravity.y = Constants.GRAVITY
        
        // Створюємо фон
        this.game.add.image(0, 0, "background")
        
        // Завантажуємо рівень
        this._loadLevel(this.game.cache.getJSON(`level:${this.level}`))
        
        // Створюємо групи спрайтів
        this._createHud()
        
        // Створюємо групу для бомб над іншими об'єктами
        this.throwBombs = this.game.add.group()
        this.throwBombs.enableBody = true
        this.game.world.bringToTop(this.throwBombs)
        
        // Налаштовуємо звуки
        this.sfx = {
            jump: this.game.add.audio('sfx:jump'),
            coin: this.game.add.audio('sfx:coin'),
            stomp: this.game.add.audio('sfx:stomp'),
            stomp2: this.game.add.audio('sfx:stomp2'),
            key: this.game.add.audio('sfx:key'),
            door: this.game.add.audio('sfx:door'),
            bomb_throw: this.game.add.audio('sfx:bomb_throw'),
            pluh: this.game.add.audio('sfx:pluh')
        }
        
        // Встановлюємо гучність
        for (let sound in this.sfx) {
            if (this.sfx.hasOwnProperty(sound)) {
                this.sfx[sound].volume = Constants.AUDIO_VOLUME
            }
        }
        
        // Запускаємо музику
        this.sfx.bgm = this.game.add.audio('bgm')
        this.sfx.bgm.volume = Constants.AUDIO_VOLUME
        this.sfx.bgm.loopFull()
    },

    /**
     * Оновлення стану гри
     * Викликається кожен кадр для обробки логіки гри
     */
    update: function () {
        this._handleCollisions()
        this._handleInput()
        
        // Оновлюємо HUD
        this.coinFont.text = 'X' + this.coinPickupCount.toString()
        this.keyIcon.frame = this.hasKey ? 1 : 0
        
        // Оновлюємо лічильник влучань бомбами
        if (this.boss && this.boss.exists) {
            this.bombHitsFont.text = 'X' + (Constants.BOSS_BOMB_HITS_REQUIRED - this.boss.bombHits).toString()
        }
    },

    /**
     * Обробка всіх колізій між ігровими об'єктами
     * @private
     */
    _handleCollisions: function () {
        // Колізії з платформами
        this.game.physics.arcade.collide(this.hero, this.platforms)
        this.game.physics.arcade.collide(this.spiders, this.platforms)
        this.game.physics.arcade.collide(this.spiders, this.enemyWalls)
        this.game.physics.arcade.collide(this.throwBombs, this.platforms)
        
        // Колізії з босом
        if (this.boss && this.boss.exists) {
            this.game.physics.arcade.collide(this.boss, this.platforms)
            this.game.physics.arcade.overlap(this.hero, this.bossGroup, this._onHeroVsEnemy, null, this)
            this.game.physics.arcade.overlap(this.throwBombs, this.bossGroup, this._onBombVsBoss, null, this)
        }
        
        // Колізії з павуками
        this.game.physics.arcade.overlap(this.throwBombs, this.spiders, this._onBombVsSpider, null, this)
        this.game.physics.arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy, null, this)
        
        // Колізії з предметами
        this.game.physics.arcade.overlap(this.hero, this.coins, this._onHeroVsCoin, null, this)
        this.game.physics.arcade.overlap(this.hero, this.key, this._onHeroVsKey, null, this)
        this.game.physics.arcade.overlap(this.hero, this.door, this._onHeroVsDoor, this._isDoorOpen, this)
    },

    /**
     * Обробка користувацького вводу (клавіатура)
     * @private
     */
    _handleInput: function () {
        if (this.keys.left.isDown) {
            this.hero.move(-1)
        } else if (this.keys.right.isDown) {
            this.hero.move(1)
        } else {
            this.hero.move(0)
        }
        if (this.keys.throw.isDown && !this._throwCooldown) {
            this.hero.throwBombs()
            this._throwCooldown = true
            this.game.time.events.add(Constants.THROW_COOLDOWN, function () { this._throwCooldown = false }, this)
        }
    },

    /**
     * Завантаження рівня з JSON даних
     * @param {Object} data - Дані рівня
     * @private
     */
    _loadLevel: function (data) {
        this.bgDecoration = this.game.add.group()
        this.platforms = this.game.add.group()
        this.coins = this.game.add.group()
        this.spiders = this.game.add.group()
        this.enemyWalls = this.game.add.group()
        this.enemyWalls.visible = false
        
        data.platforms.forEach(this._spawnPlatform, this)
        this._spawnCharacters({ hero: data.hero, spiders: data.spiders, boss: data.boss })
        data.coins.forEach(this._spawnCoin, this)
        this._spawnDoor(data.door.x, data.door.y)
        this._spawnKey(data.key.x, data.key.y)
        
        this.game.physics.arcade.gravity.y = Constants.GRAVITY
    },

    /**
     * Створення HUD (інтерфейсу користувача)
     * @private
     */
    _createHud: function () {
        // Створюємо групу для HUD
        this.hud = this.game.add.group()
        this.hud.position.set(Constants.HUD.POSITION_X, Constants.HUD.POSITION_Y)
        
        // Створюємо шрифт для HUD
        this.coinFont = this.game.add.retroFont('font:numbers', 20, 26, Constants.NUMBERS_STR, 6)
        
        // Створюємо іконку ключа
        this.keyIcon = this.game.add.sprite(0, 19, 'icon:key', 0)
        this.keyIcon.anchor.set(0, 0.5)
        
        // Створюємо лічильник монет
        let coinIcon = this.game.make.image(this.keyIcon.width + Constants.HUD.SPACING, 0, 'icon:coin')
        let coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width + 5, 0, this.coinFont)
        
        // Створюємо лічильник бомб
        let bombIcon = this.game.make.image(coinScoreImg.x + coinScoreImg.width + Constants.HUD.SPACING, 0, 'bomb')
        bombIcon.scale.set(0.5)
        this.bombHitsFont = this.game.add.retroFont('font:numbers', 20, 26, Constants.NUMBERS_STR, 6)
        let bombHitsImg = this.game.make.image(bombIcon.x + bombIcon.width + 5, 0, this.bombHitsFont)
        
        // Додаємо всі елементи до HUD
        this.hud.addChild(this.keyIcon)
        this.hud.addChild(coinIcon)
        this.hud.addChild(coinScoreImg)
        this.hud.addChild(bombIcon)
        this.hud.addChild(bombHitsImg)
        
        // Встановлюємо початкові значення
        this.coinPickupCount = 0
        this.bossHitsLeft = Constants.BOSS_BOMB_HITS_REQUIRED
        this.hasKey = false
        
        // Оновлюємо текст
        this.coinFont.text = 'X0'
        this.bombHitsFont.text = 'X' + this.bossHitsLeft.toString()
    },

    /**
     * Створення персонажів на рівні
     * @param {Object} data - Дані про розташування персонажів
     * @private
     */
    _spawnCharacters: function (data) {
        // Створюємо групу для павуків
        this.spiders = this.game.add.group()
        data.spiders.forEach(function (spider) {
            let sprite = new Spider(this.game, spider.x, spider.y)
            this.spiders.add(sprite)
        }, this)

        // Створюємо боса
        if (data.boss) {
            // Створюємо групу для боса
            this.bossGroup = this.game.add.group()
            this.boss = new Boss(this.game, data.boss.x, data.boss.y)
            this.bossGroup.add(this.boss)
        }
        
        this.hero = new Hero(this.game, data.hero.x, data.hero.y)
        this.game.add.existing(this.hero)
    },

    /**
     * Створення платформи
     * @param {Object} platform - Дані про платформу
     * @private
     */
    _spawnPlatform: function (platform) {
        let sprite = this.platforms.create(platform.x, platform.y, platform.image)
        this.game.physics.enable(sprite)
        sprite.body.allowGravity = false
        sprite.body.immovable = true
        this._spawnEnemyWall(platform.x, platform.y, "left")
        this._spawnEnemyWall(platform.x + sprite.width, platform.y, "right")
    },

    /**
     * Створення невидимих стін для ворогів
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @param {string} side - Сторона стіни ('left' або 'right')
     * @private
     */
    _spawnEnemyWall: function (x, y, side) {
        let sprite = this.enemyWalls.create(x, y, "invisible-wall")
        sprite.anchor.set(side === "left" ? 1 : 0, 1)
        this.game.physics.enable(sprite)
        sprite.body.immovable = true
        sprite.body.allowGravity = false
    },

    /**
     * Створення монети
     * @param {Object} coin - Дані про монету
     * @private
     */
    _spawnCoin: function (coin) {
        let sprite = this.coins.create(coin.x, coin.y, "coin")
        sprite.anchor.set(0.5, 0.5)
        sprite.animations.add("rotate", [0, 1, 2, 1], 6, true)
        sprite.animations.play("rotate")
        this.game.physics.enable(sprite)
        sprite.body.allowGravity = false
    },

    /**
     * Створення дверей
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @private
     */
    _spawnDoor: function (x, y) {
        this.door = this.bgDecoration.create(x, y, "door")
        this.door.anchor.setTo(0.5, 1)
        this.game.physics.enable(this.door)
        this.door.body.allowGravity = false
        this.door.animations.add("open", [0, 1], 8, false)
    },

    /**
     * Створення ключа
     * @param {number} x - X координата
     * @param {number} y - Y координата
     * @private
     */
    _spawnKey: function (x, y) {
        this.key = this.bgDecoration.create(x, y, "key")
        this.key.anchor.setTo(0.5, 0.5)
        this.game.physics.enable(this.key)
        this.key.body.allowGravity = false
        this.key.y -= 3
        this.game.add.tween(this.key)
            .to({ y: this.key.y + 6 }, 800, Phaser.Easing.Sinusoidal.InOut)
            .yoyo(true)
            .loop()
            .start()
    },

    /**
     * Обробка колізії героя з монетою
     * @param {Hero} hero - Об'єкт героя
     * @param {Phaser.Sprite} coin - Об'єкт монети
     * @private
     */
    _onHeroVsCoin: function (hero, coin) {
        this.sfx.coin.play()
        coin.kill()
        this.coinPickupCount++
    },

    /**
     * Обробка колізії героя з ворогом
     * @param {Hero} hero - Об'єкт героя
     * @param {Spider} enemy - Об'єкт ворога
     * @private
     */
    _onHeroVsEnemy: function (hero, enemy) {
        // Якщо герой падає на ворога
        if (hero.body.velocity.y > 0) {
            // Підстрибуємо
            hero.bounce()
            
            // Якщо це бос - перевіряємо чи можна нанести урон
            if (enemy === this.boss) {
                if (enemy.damage()) {
                    // Випадковий звук
                    const choiceSfx = Math.ceil(Math.random() * 2)
                    switch (choiceSfx) {
                        case 1:
                            this.sfx.stomp.play()
                            break
                        case 2:
                            this.sfx.stomp2.play()
                            break
                    }
                }
            } else {
                // Якщо звичайний павук - вбиваємо його
                enemy.die()
                // Випадковий звук
                const choiceSfx = Math.ceil(Math.random() * 2)
                switch (choiceSfx) {
                    case 1:
                        this.sfx.stomp.play()
                        break
                    case 2:
                        this.sfx.stomp2.play()
                        break
                }
            }
        } else {
            // Якщо герой торкнувся ворога збоку - програємо
            this.sfx.stomp.play()
            
            // Зупиняємо фонову музику перед рестартом рівня
            if (this.sfx.bgm) {
                this.sfx.bgm.stop()
            }
            
            this.game.state.restart(true, false, { level: this.level })
        }
    },

    /**
     * Обробка колізії героя з ключем
     * @param {Hero} hero - Об'єкт героя
     * @param {Phaser.Sprite} key - Об'єкт ключа
     * @private
     */
    _onHeroVsKey: function (hero, key) {
        this.sfx.key.play()
        key.kill()
        this.hasKey = true
        this.keyIcon.frame = 1 // Змінюємо на червоний ключ
    },

    /**
     * Обробка колізії героя з дверима
     * @param {Hero} hero - Об'єкт героя
     * @param {Phaser.Sprite} door - Об'єкт дверей
     * @private
     */
    _onHeroVsDoor: function (hero, door) {
        // Перевіряємо чи можна відкрити двері і чи не відбувається вже анімація
        if (this._isDoorOpen(hero, door) && !this.doorIsAnimating) {
            // Встановлюємо прапорець анімації
            this.doorIsAnimating = true
            
            // Програємо звук і анімацію
            this.sfx.door.play()
            door.animations.play('open')
            
            // Зупиняємо поточну музику
            if (this.sfx.bgm) {
                this.sfx.bgm.stop()
            }
            
            // Затримка перед переходом на наступний рівень
            this.game.time.events.add(1000, () => {
                this.game.state.start('play', true, false, {
                    level: this.level + 1
                })
            })
        }
    },

    /**
     * Обробка колізії бомби з землею
     * @param {Phaser.Sprite} bomb - Об'єкт бомби
     * @param {Phaser.Sprite} ground - Об'єкт землі
     * @private
     */
    _onBombVsGround: function (bomb, ground) {
        this.sfx.pluh.play()
        
        // Створюємо анімацію вибуху
        let explosion = this.game.add.sprite(bomb.x, bomb.y, 'explode')
        explosion.anchor.setTo(0.5, 0.5)
        let anim = explosion.animations.add('explode')
        anim.onComplete.add(function() { explosion.kill() })
        explosion.animations.play('explode', 30, false)  // 30 fps, не зациклена
        
        bomb.kill()
    },

    /**
     * Обробка колізії бомби з павуком
     * @param {Phaser.Sprite} bomb - Об'єкт бомби
     * @param {Spider} spider - Об'єкт павука
     * @private
     */
    _onBombVsSpider: function (bomb, spider) {
        // Програємо звук
        this.sfx.pluh.play()
        
        // Створюємо анімацію вибуху
        let explosion = this.game.add.sprite(bomb.x, bomb.y, 'explode')
        explosion.anchor.setTo(0.5, 0.5)
        let anim = explosion.animations.add('explode')
        anim.onComplete.add(function() { explosion.kill() })
        explosion.animations.play('explode', 30, false)
        
        // Видаляємо бомбу
        bomb.kill()
        
        // Запускаємо анімацію смерті павука
        spider.die()
        
        // Додаємо очки
        this.coinPickupCount += Constants.SPIDER_KILL_SCORE
    },

    /**
     * Обробка колізії бомби з босом
     * @param {Phaser.Sprite} bomb - Об'єкт бомби
     * @param {Boss} boss - Об'єкт боса
     * @private
     */
    _onBombVsBoss: function (bomb, boss) {
        // Програємо звук
        this.sfx.pluh.play()
        
        // Створюємо анімацію вибуху
        let explosion = this.game.add.sprite(bomb.x, bomb.y, 'explode')
        explosion.anchor.setTo(0.5, 0.5)
        let anim = explosion.animations.add('explode')
        anim.onComplete.add(function() { explosion.kill() })
        explosion.animations.play('explode', 30, false)
        
        // Видаляємо бомбу
        bomb.kill()
        
        // Наносимо урон босу
        boss.hitByBomb()
        
        // Оновлюємо лічильник влучань
        this.bossHitsLeft = Math.max(0, this.bossHitsLeft - 1)
        this.bombHitsFont.text = this.bossHitsLeft.toString()
    },

    _isDoorOpen: function (hero, door) {
        console.log('Door check - hasKey:', this.hasKey, 'touching down:', hero.body.touching.down)
        return this.hasKey && hero.body.touching.down
    }
}
