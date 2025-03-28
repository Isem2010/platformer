// Точка входу в гру
import PlayState from './states/PlayState.js'
import Constants from './config/constants.js'

window.onload = function () {
    let game = new Phaser.Game(Constants.GAME_WIDTH, Constants.GAME_HEIGHT, Phaser.AUTO, "game")
    game.state.add("play", PlayState)
    game.state.start("play", true, false, { level: 0 })
}
