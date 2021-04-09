const fps = 50;
const mapMaximumSizeMultiplier = 0.8
const gameStages = ['authorizationScreen', 'newGameScreen', 'levelSelectScreen', 'gameScreen', 'gameEndScreen'];
const colors = ['#FF3C00', '#F79A00', '#F2C500', '#F0FF00', '#BAFF00', '#4CBE2C', '#2F77CF', '#5700FF', '#53009F', '#9000AD', '#A4003D', '#FF0000'];
let currentGameStage = gameStages[0];
let tileXCount = 0;
let tileYCount = 0;
let towerList = [];
let currentlyActiveTowers = [];

let mouseXPosition = 0; // delete later
let mouseYPosition = 0; //delete later
let timer;
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
    
    let towers = document.getElementsByClassName('tower');
    for(let i = 0; i < towers.length; i++) {
        rotateTowerToMouse(towers[i]);
    }

    timer = setTimeout(mainloop);
    return;
}

function getTileSize(mapHeight, mapWidth) {
    let maxXSize = Math.floor(window.innerWidth * mapMaximumSizeMultiplier / tileXCount);
    let maxYSize = Math.floor(window.innerHeight * mapMaximumSizeMultiplier / tileYCount);
    return Math.min(maxXSize, maxYSize);
}

function generateTower(tileXPosition, tileYPosition) {
    let tower = document.createElement('div');
    tower.className = "tower";
    let towerColorId = getRandomInt(0, colors.length);
    tower.style.backgroundColor = colors[towerColorId];
    let gun = document.createElement('div');
    gun.className = "towerGun";
    tower.appendChild(gun);
    towerList.push({
        X: tileXPosition,
        Y: tileYPosition,
        color: towerColorId,
        level: 1
    });
    return tower;
}

function renderMap(map) {
    tileYCount = map.length;
    tileXCount = map[0].length;
    for (let y = 0; y < map.length; y++) {
        let tileRow = document.createElement('div');
        tileRow.className = "tileRow";
        for (let x = 0; x < map[y].length; x++) {
            let tile = document.createElement('div');
            tile.className = 'tile';
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
                    throw `Unexpected tile value at map ${map}`;
            }
            tile.id = `tile_${y}_${x}`;
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

function getRandomInt(lowerBound, upperBound) {
    lowerBound = Math.ceil(lowerBound);
    upperBound = Math.floor(upperBound);
    return Math.floor(Math.random() * (upperBound - lowerBound)) + lowerBound;
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener('resize', resizeMap);

// Temp functions, no need in them later
///////////////////////////////////////////////////////////////////////////////////////////////////

document.onmousemove = handleMouseMove;

function handleMouseMove(event) {
    var eventDoc, doc, body;

    event = event || window.event; // IE-ism

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = event.clientX +
          (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
          (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY +
          (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
          (doc && doc.clientTop  || body && body.clientTop  || 0 );
    }
    mouseXPosition = event.pageX;
    mouseYPosition = event.pageY;
}

function rotateTowerToMouse(tower) {
    let boundingRect = tower.getBoundingClientRect();
    let deltaX = mouseXPosition - boundingRect.x - boundingRect.width / 2;
    let deltaY = mouseYPosition - boundingRect.y - boundingRect.height / 2;
    let angle = Math.atan(deltaY / deltaX) * 180 / Math.PI;
    if (deltaX < 0) {
        angle += 180;
    }
    tower.style.rotate = `${angle}deg`;
}
///////////////////////////////////////////////////////////////////////////////////////////////////