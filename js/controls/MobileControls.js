export default class MobileControls {
    constructor(game, hero) {
        this.game = game
        this.hero = hero
        
        // Створюємо віртуальні кнопки
        this.createVirtualButtons()
        
        // Флаги для відстеження натискань
        this.isLeftDown = false
        this.isRightDown = false
        this.isJumpDown = false
        this.isThrowDown = false
    }

    createVirtualButtons() {
        const buttonStyle = {
            font: '32px Arial',
            fill: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: { x: 20, y: 20 }
        }

        // Створюємо групу для кнопок
        this.buttonGroup = this.game.add.group()

        // Ліва кнопка
        this.leftButton = this.game.add.text(50, this.game.height - 100, '←', buttonStyle)
        this.leftButton.inputEnabled = true
        this.leftButton.input.priorityID = 1  // Вищий пріоритет для кнопок
        this.leftButton.events.onInputDown.add(() => this.onLeftDown())
        this.leftButton.events.onInputUp.add(() => this.onLeftUp())
        this.leftButton.alpha = 0.7
        this.buttonGroup.add(this.leftButton)

        // Права кнопка
        this.rightButton = this.game.add.text(150, this.game.height - 100, '→', buttonStyle)
        this.rightButton.inputEnabled = true
        this.rightButton.input.priorityID = 1
        this.rightButton.events.onInputDown.add(() => this.onRightDown())
        this.rightButton.events.onInputUp.add(() => this.onRightUp())
        this.rightButton.alpha = 0.7
        this.buttonGroup.add(this.rightButton)

        // Кнопка стрибка
        this.jumpButton = this.game.add.text(this.game.width - 150, this.game.height - 100, '↑', buttonStyle)
        this.jumpButton.inputEnabled = true
        this.jumpButton.input.priorityID = 1
        this.jumpButton.events.onInputDown.add(() => this.onJumpDown())
        this.jumpButton.events.onInputUp.add(() => this.onJumpUp())
        this.jumpButton.alpha = 0.7
        this.buttonGroup.add(this.jumpButton)

        // Кнопка кидання бомби
        this.throwButton = this.game.add.text(this.game.width - 80, this.game.height - 100, '💣', buttonStyle)
        this.throwButton.inputEnabled = true
        this.throwButton.input.priorityID = 1
        this.throwButton.events.onInputDown.add(() => this.onThrowDown())
        this.throwButton.events.onInputUp.add(() => this.onThrowUp())
        this.throwButton.alpha = 0.7
        this.buttonGroup.add(this.throwButton)

        // Фіксуємо кнопки відносно камери
        this.buttonGroup.fixedToCamera = true
    }

    onLeftDown() {
        this.isLeftDown = true
        if (this.hero) this.hero.move(-1)
    }

    onLeftUp() {
        this.isLeftDown = false
        if (this.hero && !this.isRightDown) this.hero.move(0)
    }

    onRightDown() {
        this.isRightDown = true
        if (this.hero) this.hero.move(1)
    }

    onRightUp() {
        this.isRightDown = false
        if (this.hero && !this.isLeftDown) this.hero.move(0)
    }

    onJumpDown() {
        this.isJumpDown = true
        if (this.hero) this.hero.jump()
    }

    onJumpUp() {
        this.isJumpDown = false
    }

    onThrowDown() {
        this.isThrowDown = true
        if (this.hero && typeof this.hero.throwBombs === 'function') {
            this.hero.throwBombs()
        }
    }

    onThrowUp() {
        this.isThrowDown = false
    }

    update() {
        // Оновлення стану героя на основі натиснутих кнопок
        if (this.hero) {
            if (this.isLeftDown) this.hero.move(-1)
            else if (this.isRightDown) this.hero.move(1)
        }
    }

    destroy() {
        // Видаляємо групу з усіма кнопками
        if (this.buttonGroup) {
            this.buttonGroup.destroy()
        }
    }
}
