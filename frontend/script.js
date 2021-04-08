const fps = 50;
const mapMaximumSizeMultiplier = 0.8
const gameStages = ['authorizationScreen', 'newGameScreen', 'levelSelectScreen', 'gameScreen', 'gameEndScreen'];
let currentGameStage = gameStages[0];
let tileXCount = 0;
let tileYCount = 0;

let tempMap = [
    [0, 0, 3, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 2, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
    [0, 1, 1, 1, 0, 0, 1, 2, 1, 0],
    [0, 0, 0, 0, 0, 0, 1, 2, 1, 0],
    [0, 0, 0, 0, 1, 1, 1, 2, 0, 0],
    [0, 0, 1, 2, 2, 2, 2, 2, 1, 0],
    [0, 0, 1, 2, 1, 1, 0, 1, 1, 0],
    [0, 0, 1, 2, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 4, 0, 0, 0, 0, 0, 0],
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

function getTileSize(mapHeight, mapWidth) {
    let maxXSize = Math.floor(window.innerWidth * mapMaximumSizeMultiplier / tileXCount);
    let maxYSize = Math.floor(window.innerHeight * mapMaximumSizeMultiplier / tileYCount);
    return Math.min(maxXSize, maxYSize);
}

function renderMap(map) {
    tileYCount = map.length;
    tileXCount = map[0].length;
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
                    break;
                default:
                    alert("WHAT HAVE YOU DONE STUPID MONKE!?");
                    throw `Unexpected tile value at map ${map}`;
            }
            tile.id = `tile_${i}_${j}`;
            tileRow.appendChild(tile);
        }
        document.getElementById('tileContainer').appendChild(tileRow);
    }
    resizeMap();
}

function resizeMap() {
    let maxTileSize = getTileSize(tileYCount, tileXCount);
    let rows = document.getElementsByClassName('tileRow');
    for (let rowId = 0; rowId < tileYCount; rowId++) {
        rows[rowId].style.height = `${maxTileSize}px`;
    }
    let tiles = document.getElementsByClassName('tile')
    for (let tileId = 0; tileId < tileYCount * tileXCount; tileId++) {
        tiles[tileId].style.margin = `${Math.floor(maxTileSize * 0.05)}px`;
        tiles[tileId].style.height = `${Math.floor(maxTileSize * 0.95)}px`;
        tiles[tileId].style.width = `${Math.floor(maxTileSize * 0.95)}px`;
    }
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener('resize', resizeMap);