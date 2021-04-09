const fps = 50;
const mapMaximumSizeMultiplier = 0.8; // чисто для того, чтобы карта не занимала весь экран
const gameStages = [ // пока не используется
    "authorizationScreen",
    "newGameScreen",
    "levelSelectScreen",
    "gameScreen",
    "gameEndScreen",
];
let currentGameStage = gameStages[0]; // пока не используется
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
// тут вообще мало что юзаем, буду делать пажылой рефактор
let tileXCount = 0;
let tileYCount = 0;
let towerList = [];
let currentlyActiveTowers = [];
let currentDeltaBetweenEnemies = 5000; // time in ms
let killedEnemies = 0;
let playerMoney = 0; 
let timer;
let enemies = [];
let baseHP = 100;

// цвета указаны вот здесь, ды
// 0 - emptyTile, 1 - towerPlatformTile, 2 - roadTile, 3 - spawnTile, 4 - baseTile
const tempMap = { // потом это будем брать с сервера
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

function init() { // хорошо, вроде бы
    renderMap(tempMap.dimensionalArray);
    mainloop();
}

function mainloop() { // стартует, но ничего тут не происходит лул
    enemies.push(new Enemy());
    // DO SOMETHING
    // timer = setTimeout(mainloop);
}

function getTileSize(mapHeight, mapWidth) { // в принципе, покатит
    let maxXSize = Math.floor(
        (window.innerWidth * mapMaximumSizeMultiplier) / tileXCount
    );
    let maxYSize = Math.floor(
        (window.innerHeight * mapMaximumSizeMultiplier) / tileYCount
    );
    return Math.min(maxXSize, maxYSize);
}

function generateTower(tileXPosition, tileYPosition) { // переписать через класс
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

function renderMap(map) { // хорошо, скорее всего
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
                    tile.onclick = function() {tileClickHandler(x, y, true)}
                    break;
                case 2:
                    tile.className += " roadTile";
                    break;
                case 3:
                    tile.className += " spawnTile";
                    break;
                case 4:
                    tile.className += " baseTile";
                    tile.onclick = function() {tileClickHandler(x, y, false)}
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

function tileClickHandler(x, y, isTower) { // бага с определением наличия элемента и с засвечиванием элементов, на которые нажал пользователь
    if (isTower && currentlyActiveTowers.indexOf([x, y]) < 0) {
        currentlyActiveTowers.push([x, y]);
        document.getElementById(`tile_${y}_${x}`).style.boxShadow = "0 0 3px 2px white";
        let removedTower;
        if (currentlyActiveTowers.length > 2)
            removedTower = currentlyActiveTowers.shift();
        if (removedTower)
            document.getElementById(`tile_${y}_${x}`).style.boxShadow = "";
    }
    console.log(`clicked on ${x} ${y}`)
    console.log(currentlyActiveTowers);
}

function resizeMap() { // хорошо
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

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", resizeMap);
