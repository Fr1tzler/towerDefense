const fps = 50;
const mapMaximumSizeMultiplier = 0.8;
const gameStages = [
    "authorizationScreen",
    "newGameScreen",
    "levelSelectScreen",
    "gameScreen",
    "gameEndScreen",
];
let currentGameStage = gameStages[0];
const colors = [
    "#FF3C00", // Можно здесь цвета проставить, но зачем?
    "#F79A00",
    "#F2C500",
    "#F0FF00",
    "#BAFF00",
    "#4CBE2C",
    "#2F77CF",
    "#5700FF",
    "#53009F",
    "#9000AD",
    "#A4003D",
    "#FF0000",
];
let tileXCount = 0;
let tileYCount = 0;
let towerList = [];
let currentlyActiveTowers = [];
let timer;

// 0 - emptyTile, 1 - towerPlatformTile, 2 - roadTile, 3 - spawnTile, 4 - baseTile

const tempMap = {
    dimensionalArray: [
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
    ],
    enemyWaypoints: [
        [0, 2],
        [2, 2],
        [2, 7],
        [6, 7],
        [6, 3],
        [9, 3],
    ],
};

function init() {
    renderMap(tempMap.dimensionalArray);
    mainloop();
}

function mainloop() {
    // DO SOMETHING
    // timer = setTimeout(mainloop);
}

function getTileSize(mapHeight, mapWidth) {
    let maxXSize = Math.floor(
        (window.innerWidth * mapMaximumSizeMultiplier) / tileXCount
    );
    let maxYSize = Math.floor(
        (window.innerHeight * mapMaximumSizeMultiplier) / tileYCount
    );
    return Math.min(maxXSize, maxYSize);
}

function generateTower(tileXPosition, tileYPosition) {
    let tower = document.createElement("div");
    tower.className = "tower";
    let towerColorId = getRandomInt(0, colors.length);
    tower.style.backgroundColor = colors[towerColorId];
    let gun = document.createElement("div");
    gun.className = "towerGun";
    tower.appendChild(gun);
    towerList.push({
        X: tileXPosition,
        Y: tileYPosition,
        self: tower,
        color: towerColorId,
        level: 1,
    });
    return tower;
}

function renderMap(map) {
    tileYCount = map.length;
    tileXCount = map[0].length;
    for (let y = 0; y < map.length; y++) {
        let tileRow = document.createElement("div");
        tileRow.className = "tileRow";
        for (let x = 0; x < map[y].length; x++) {
            let tile = document.createElement("div");
            tile.className = "tile";
            switch (map[y][x]) {
                case 0:
                    tile.className += " emptyTile";
                    break;
                case 1:
                    tile.className += " towerPlatformTile";
                    tile.appendChild(generateTower(x, y));
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
                    throw `Unexpected tile value at map`;
            }
            tile.id = `tile_${y}_${x}`;
            tileRow.appendChild(tile);
        }
        document.getElementById("tileContainer").appendChild(tileRow);
    }
    resizeMap();
}

function resizeMap() {
    let maxTileSize = getTileSize(tileYCount, tileXCount);
    let rows = document.getElementsByClassName("tileRow");
    for (let rowId = 0; rowId < tileYCount; rowId++)
        rows[rowId].style.height = `${maxTileSize}px`;
    let tiles = document.getElementsByClassName("tile");
    for (let tileId = 0; tileId < tileYCount * tileXCount; tileId++) {
        tiles[tileId].style.margin = `${Math.floor(maxTileSize * 0.05)}px`;
        tiles[tileId].style.height = `${Math.floor(maxTileSize * 0.95)}px`;
        tiles[tileId].style.width = `${Math.floor(maxTileSize * 0.95)}px`;
    }
}

function getRandomInt(lowerBound, upperBound) {
    lowerBound = Math.ceil(lowerBound);
    upperBound = Math.floor(upperBound);
    return Math.floor(Math.random() * (upperBound - lowerBound)) + lowerBound;
}

function getNextLevel(levelOne, levelTwo) {
    let maxLevel = Math.max(levelOne, levelTwo);
    let minLevel = Math.min(levelOne, levelTwo);
    return maxLevel + minLevel / maxLevel;
}

function getMergedColor(towerColorId, enemyColorId) {
    let delta = towerColorId - enemyColorId;
    if (Math.abs(delta) < 6) {
        return towerColorId + Math.trunc(delta / 2);
    }
    return 0; // something hard
}

function getDamageMultiplier(towerColorId, enemyColorId) {
    let delta = Math.abs(towerColorId - enemyColorId);
    return delta < 6 ? 1 - 0.15 * delta : -0.8 + 0.15 * delta;
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", resizeMap);
