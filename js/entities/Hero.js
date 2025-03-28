/**
 * Hero - клас головного героя гри
 * Відповідає за:
 * - Рух героя (вліво/вправо)
 * - Стрибки
 * - Анімації
 * - Кидання бомб
 */

import Constants from '../config/constants.js'

export default class Hero extends Phaser.Sprite {
    /**
     * Створює нового героя
     * @param {Phaser.Game} game - Посилання на гру
     * @param {number} x - Початкова X координата
     * @param {number} y - Початкова Y координата
     */
    constructor(game, x, y) {
        super(game, x, y, "hero")
        this.anchor.set(0.5, 0.5)
        this.game.physics.enable(this)
        this.body.collideWorldBounds = true
        this.animations.add("stop", [0])
        this.animations.add("run", [1, 2], 8, true)
        this.animations.add("jump", [3])
        this.animations.add("fall", [4])
    }

    /**
     * Рух героя
     * @param {number} direction - Напрямок руху (-1 вліво, 1 вправо, 0 стоїть)
     */
    move(direction) {
        const SPEED = 200
        this.body.velocity.x = direction * SPEED
        if (this.body.velocity.x < 0) {
            this.scale.x = -1
        } else if (this.body.velocity.x > 0) {
            this.scale.x = 1
        }
    }

    /**
     * Стрибок героя
     * @returns {boolean} Чи вдалося стрибнути
     */
    jump() {
        const JUMP_SPEED = 600
        let canJump = this.body.touching.down
        if (canJump) {
            this.body.velocity.y = -JUMP_SPEED
            return true
        }
        return false
    }

    /**
     * Відскок героя (після стрибка на ворога)
     */
    bounce() {
        const BOUNCE_SPEED = 2000
        this.body.velocity.y = -BOUNCE_SPEED
    }

    _getAnimationName() {
        let name = "stop"
        if (this.body.velocity.y < 0) {
            name = "jump"
        } else if (this.body.velocity.y >= 0 && !this.body.touching.down) {
            name = "fall"
        } else if (this.body.velocity.x !== 0 && this.body.touching.down) {
            name = "run"
        }
        return name
    }

    update() {
        let animationName = this._getAnimationName()
        if (this.animations.name !== animationName) {
            this.animations.play(animationName)
        }
    }

    /**
     * Кидання бомби
     */
    throwBombs() {
        // Створюємо бомбу
        let bomb = this.game.state.getCurrentState().throwBombs.create(this.x, this.y, 'bomb')
        
        // Налаштовуємо фізику
        this.game.physics.enable(bomb)
        bomb.body.gravity.y = 1000
        bomb.body.collideWorldBounds = true
        
        // Налаштовуємо розмір і вигляд
        bomb.scale.setTo(0.5)
        bomb.anchor.setTo(0.5)
        
        // Задаємо швидкість в залежності від напрямку героя
        bomb.body.velocity.x = (this.scale.x > 0) ? 800 : -800
        bomb.body.velocity.y = -300
        bomb.body.angularVelocity = 400
        
        // Видаляємо бомбу через 2 секунди
        this.game.time.events.add(2000, function () {
            if (bomb.exists) {
                bomb.kill()
            }
        })
    }
}
