import { GameModel } from './model.js';
import { GameView } from './view.js';
import { GameController } from './controller.js';

export class Game {
    constructor(mapData) {
        this.model = new GameModel(mapData);
        this.view = new GameView(this.model);
        this.controller = new GameController(this.model);
        this.gameEnded = false;
    }

    update() {
        if (this.gameEnded)
            return;
        this.model.update();
        this.view.update();
        this.gameEnded = !(this.model.baseHp > 0);
    }
}