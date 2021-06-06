import { GameModel } from './model/gameModel.js';
import { GameView } from './view/gameView.js';
import { GameController } from './controller/gameController.js';

export class Game {
    constructor(mapData) {
        this.model = new GameModel(mapData);
        this.view = new GameView(this.model);
        this.controller = new GameController(this.model);
        this.gameEnded = false;
        this.score = 0;
    }

    update() {
        if (this.gameEnded) {
            this.score = this.model.score;
            return;
        }
        this.model.update();
        this.view.update();
        this.gameEnded = !(this.model.baseHp > 0);
    }
}