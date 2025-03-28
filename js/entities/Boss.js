/**
 * Boss - клас боса-павука
 * Відповідає за:
 * - Рух боса
 * - Анімації
 * - Отримання пошкоджень
 * - Смерть боса
 */

import Constants from '../config/constants.js'

export default class Boss extends Phaser.Sprite {
    /**
     * Створює нового боса
     * @param {Phaser.Game} game - Посилання на гру
     * @param {number} x - Початкова X координата
     * @param {number} y - Початкова Y координата
     */
    constructor(game, x, y) {
        super(game, x, y, 'boss')
        
        // Налаштовуємо фізику
        this.game.physics.enable(this)
        this.body.collideWorldBounds = true
        
        // Встановлюємо розмір боса
        this.scale.set(2)
        
        // Налаштовуємо фізичне тіло
        this.body.setSize(24, 24, 4, 4)
        
        // Налаштовуємо анімації
        this.animations.add('walk', [0, 1], 8, true)
        this.animations.add('attack', [2, 3], 8, true)
        this.animations.add('die', [4], 8, false)
        this.animations.play('walk')
        
        // Налаштовуємо властивості
        this.anchor.set(0.5)
        this.health = Constants.BOSS_HEALTH
        this.bombHits = 0
        this.isWeakened = false
        
        // Встановлюємо початкову швидкість
        this.speed = 100
        this.body.velocity.x = this.speed
    }

    /**
     * Оновлення стану боса
     * Викликається кожен кадр
     */
    update() {
        // Перевіряємо колізії тільки якщо бос живий
        if (this.exists) {
            if (this.body.touching.right || this.body.blocked.right) {
                this.body.velocity.x = -this.speed
                this.scale.x = -2
            }
            else if (this.body.touching.left || this.body.blocked.left) {
                this.body.velocity.x = this.speed
                this.scale.x = 2
            }
        }
    }
    
    /**
     * Наносить пошкодження босу від бомби
     */
    hitByBomb() {
        if (!this.isWeakened && this.exists) {
            this.bombHits++
            
            // Змінюємо анімацію на атаку
            this.animations.play('attack')
            
            // Через 0.5 секунди повертаємось до ходьби
            this.game.time.events.add(500, () => {
                if (this.exists) {
                    this.animations.play('walk')
                }
            })
            
            // Перевіряємо чи достатньо влучань
            if (this.bombHits >= Constants.BOSS_BOMB_HITS_REQUIRED) {
                this.isWeakened = true
            }
        }
    }
    
    /**
     * Наносить пошкодження босу від стрибка героя
     * @returns {boolean} true якщо бос отримав пошкодження
     */
    damage() {
        if (this.isWeakened && this.exists && this.health > 0) {
            this.health--
            
            // Змінюємо анімацію на атаку
            this.animations.play('attack')
            
            // Через 0.5 секунди повертаємось до ходьби
            this.game.time.events.add(500, () => {
                if (this.exists) {
                    this.animations.play('walk')
                }
            })
            
            if (this.health <= 0) {
                this.die()
            }
            return true
        }
        return false
    }
    
    /**
     * Вбиває боса
     */
    die() {
        this.body.enable = false
        this.animations.play('die')
        
        // Через 1 секунду видаляємо боса
        this.game.time.events.add(1000, () => {
            this.kill()
        })
    }
}
