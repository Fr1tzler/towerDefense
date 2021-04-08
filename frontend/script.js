document.addEventListener("DOMContentLoaded", init);

const fps = 50;
const gameStages = ['authorizationScreen', 'newGameScreen', 'levelSelectScreen', 'gameScreen', 'gameEndScreen'];
let currentGameStage = gameStages[0];


let tempMap = [
    [0, 1, 4, 1, 0, 0],
    [0, 1, 2, 1, 0, 0],
    [0, 1, 2, 1, 1, 0],
    [0, 1, 2, 2, 1, 0],
    [0, 1, 1, 2, 1, 0],
    [0, 0, 1, 3, 1, 0],
];

/*
    0 - emptyTile,
    1 - towerPlatformTile,
    2 - roadTile,
    3 - spawnTile,
    4 - baseTile
*/

function init() {
    renderMap(tempMap);
    mainloop();
    return;
}

function mainloop() {
    // DO SOMETHING
    // let timer = setTimeout(mainloop, 1000 / fps);
    return;
}

function renderMap(map) {
    for (let i = 0; i < map.length; i++) {
        let tileRow = document.createElement('div');
        tileRow.className = "tileRow";
        for (let j = 0; j < map[i].length; j++) {
            let tile = document.createElement('div');
            tile.className = 'tile';
            switch (map[i][j]) {
                case 0:
                    tile.className += " emptyTile";
                    break;
                case 1:
                    tile.className += " towerPlatformTile";
                    break;
                case 2:
                    tile.className += " roadTile";
                    break;
                case 3:
                    tile.className += " spawnTile";
                    break;
                case 4:
                    tile.className += " baseTile";
            }
            tile.id = `tile_${i}_${j}`;
            tileRow.appendChild(tile);
        }
        document.getElementById('tileContainer').appendChild(tileRow);
    }
}