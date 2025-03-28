/**
 * Spider - клас ворога-павука
 * Відповідає за:
 * - Рух павука
 * - Анімації
 * - Смерть павука
 */
export default class Spider extends Phaser.Sprite {
    /**
     * Швидкість руху павука
     * @static
     * @type {number}
     */
    static get SPEED() { return 100 }

    /**
     * Створює нового павука
     * @param {Phaser.Game} game - Посилання на гру
     * @param {number} x - Початкова X координата
     * @param {number} y - Початкова Y координата
     */
    constructor(game, x, y) {
        super(game, x, y, "spider")
        this.anchor.set(0.5)

        this.animations.add("crawl", [0, 1, 2], 8, true)
        this.animations.add("die", [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12)
        this.animations.play("crawl")

        this.game.physics.enable(this)
        this.body.collideWorldBounds = true
        this.body.velocity.x = Spider.SPEED
    }

    /**
     * Оновлення стану павука
     * Викликається кожен кадр
     */
    update() {
        if (this.body.touching.right || this.body.blocked.right) {
            this.body.velocity.x = -Spider.SPEED
        } else if (this.body.touching.left || this.body.blocked.left) {
            this.body.velocity.x = Spider.SPEED
        }
    }

    /**
     * Вбиває павука
     */
    die() {
        this.body.enable = false
        
        // Запускаємо анімацію смерті
        this.animations.play('die').onComplete.addOnce(() => {
            this.kill()
        })
    }
}
