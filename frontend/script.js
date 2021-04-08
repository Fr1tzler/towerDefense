document.addEventListener("DOMContentLoaded", main);

let currentGameStage;
const gameStages = ['authorizationScreen', 'newGameScreen', 'levelSelectScreen', 'gameScreen', 'gameEndScreen'];

function main() {
    return;
}

let tempMap = [
    [0, 1, 4, 1, 0, 0],
    [0, 1, 2, 1, 0, 0],
    [0, 1, 2, 1, 1, 0],
    [0, 1, 2, 2, 1, 0],
    [0, 1, 1, 2, 1, 0],
    [0, 0, 1, 3, 1, 0],
]

/*
    0 - emptyTile,
    1 - towerPlatformTile,
    2 - roadTile,
    3 - spawnTile,
    4 - baseTile
*/