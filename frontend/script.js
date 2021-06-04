import { towerTierPath, enemyTierPath } from './geometry.js';
import { EnemyModel, TowerModel, GameModel } from './model.js';
import * as Configs from './configs.js';

const tempMap = {
    map: [
        ['e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e'],
        ['e', 'r', 'r', 'r', 'e', 'e', 'r', 'r', 'r', 'e'],
        ['e', 'r', 't', 'r', 'e', 'e', 'r', 't', 'r', 'e'],
        ['e', 'r', 't', 'r', 'e', 'e', 'r', 't', 'r', 'e'],
        ['e', 'r', 't', 'r', 'e', 'e', 'r', 't', 'r', 'e'],
        ['e', 'r', 't', 'r', 'e', 'e', 'r', 't', 'r', 'e'],
        ['e', 'r', 't', 'r', 'e', 'e', 'r', 't', 'r', 'e'],
        ['e', 'r', 't', 'r', 'e', 'e', 'r', 't', 'r', 'e'],
        ['e', 'r', 't', 'r', 'r', 'r', 'r', 't', 'r', 'e'],
        ['e', 'b', 'e', 'e', 'e', 'e', 'e', 'e', 's', 'e']
    ],
    waypoints: [
        { X: 8, Y: 9 },
        { X: 8, Y: 1 },
        { X: 6, Y: 1 },
        { X: 6, Y: 8 },
        { X: 3, Y: 8 },
        { X: 3, Y: 1 },
        { X: 1, Y: 1 },
        { X: 1, Y: 9 },
    ]
}

let mapPage = 0;
let username = 'username';
let score = 0;
let mapId = 0;
let pageFocused = true;

let currentGameStage = 0;
let lastKnownGameStage = 0;

let game = undefined;
let selectedMap = tempMap;

document.addEventListener('DOMContentLoaded', init);

function init() {
    let usernameCookie = getCookie('username');
    if (usernameCookie)
        document.getElementById('usernameField').value = usernameCookie;
    document.getElementById('confirmUsername').addEventListener('click', saveUsernameInCookies);

    document.addEventListener('focus', () => {pageFocused = true});
    document.addEventListener('blur', () => {pageFocused = false});

    document.getElementById('startNewGame').addEventListener('click',  () => { currentGameStage = 1; });
    document.getElementById('gotoNewGameScreen').addEventListener('click', () => { currentGameStage = 0; })

    mainloop();
}

function mainloop() {
    if (currentGameStage == lastKnownGameStage) {
        if (currentGameStage == 1) {
            game.update()
            if (game.gameEnded) {
                game = undefined;
                requestGameStats();
                currentGameStage = 2;
            }
        }
    } else {
        lastKnownGameStage = currentGameStage;
        switch (currentGameStage) {
            case 0:
                requestMapPage();
                makeScreenVisible('pregame');
                break;
            case 1:
                makeScreenVisible('game');
                game = new Game(selectedMap);
                game.update();
                break;
            case 2:
                makeScreenVisible('aftergame');
                break;
            default:
                break;
        }
    }
    setTimeout(mainloop, 1000 / Configs.fps);
}

function makeScreenVisible(screenId) {
    document.getElementById('pregame').style.visibility = 'hidden';
    document.getElementById('game').style.visibility = 'hidden';
    document.getElementById('aftergame').style.visibility = 'hidden';

    document.getElementById('pregame').style.opacity = 0;
    document.getElementById('game').style.opacity = 0;
    document.getElementById('aftergame').style.opacity = 0;

    document.getElementById(screenId).style.visibility = 'visible';
    document.getElementById(screenId).style.opacity = 1;
}

function saveUsernameInCookies() {
    username = document.getElementById('usernameField').value;
    document.cookie = `username=${username}; SameSite=LAX`;
}

function getCookie(cookieName) {
    cookieName += "=";
    let cookieArray = document.cookie.split(';');
    cookieArray.forEach((cookie) => {
        while (cookie.charAt(0) == ' ')
            cookie = cookie.substring(1, cookie.length);
        if (cookie.indexOf(cookieName) == 0)
            return cookie.substring(cookieName.length, cookie.length);
    })
    return null;
}

function requestMapPage() {
    fetch(`/get_maps?mapPage=${mapPage}`, {})
        .then(response => { return response.json(); })
        .then(result => { drawMaps(result); })
}

function requestGameStats() {
    let requestData = {
        username: username,
        score: score,
        mapId: mapId
    };
    fetch('/send_game_stats', {
        method: 'POST',
        body: JSON.stringify(requestData),
    })
        .then(response => { return response.json(); })
        .then(result => { updateLeaderbords(result); })
}

// TODO:
function updateLeaderbords(leaders) {
    console.log(leaders);    
}

//TODO: отрисовка страницы с картами на стартовом экране
function drawMaps(mapList) {
    console.log(mapList);
}

class GameView {
    constructor(modelInfo) {
        this.origin = modelInfo;
        let tileScreen = document.getElementById('tileScreen');
        tileScreen.innerHTML = '<canvas class="laserRayLayer" id="laserRayLayer" height="800" width="800"></canvas>'; // FIXME: поправить, когда будет время

        for (let tileY = 0; tileY < 10; tileY++) {
            let row = document.createElement('div');
            row.className = 'tileRow';
            tileScreen.appendChild(row);
            for (let tileX = 0; tileX < 10; tileX++) {
                let tile = document.createElement('div');
                tile.className = 'tile ';
                tile.className += this.tileToClassDictionary[modelInfo.mapData.map[tileY][tileX]];
                tile.id = `tile_${tileX}_${tileY}`;
                row.appendChild(tile);
            }
        }

        let canvas = document.getElementById('laserRayLayer');
        canvas.style.width = `${Configs.mapSizePx}px`;
        canvas.style.height = `${Configs.mapSizePx}px`;
        canvas.style.top = `${Configs.paddingSizePx}px`;
        canvas.style.left = `${Configs.paddingSizePx}px`;
        this.context = canvas.getContext('2d');
        this.context.lineWidth = 3;

        // adding baseHp progressbar on field
        this.baseLocation = modelInfo.calculateBaseLocation();
        let baseTile = document.getElementById(`tile_${this.baseLocation[0]}_${this.baseLocation[1]}`);
        this.progressBarRadius = Math.trunc(baseTile.scrollHeight * Configs.mapSizePx / 1000 / 2);
        this.mergeButton = document.getElementById('mergeButtonLabel');
    }

    update() {
        this.context.clearRect(0, 0, Configs.mapSizePx, Configs.mapSizePx);
        // drawing laser rays
        this.origin.laserRayList.forEach((currentRay) => {
            let lineFrom = this.transformModelToCanvasCoords(currentRay.from, true);
            let lineTo = this.transformModelToCanvasCoords(currentRay.to, false);
            this.context.strokeStyle = Configs.colors[currentRay.colorId];
            this.context.beginPath();
            this.context.moveTo(lineFrom.X, lineFrom.Y);
            this.context.lineTo(lineTo.X, lineTo.Y);
            this.context.closePath();
            this.context.stroke();
        });

        // drawing towers
        this.origin.towerMap.forEach((tower, coords, map) => {
            this.drawTowerOnCanvas(tower);
        })

        // drawing enemies
        this.origin.activeEnemyList.forEach((enemy) => {
            this.drawEnemyOnCanvas(enemy);
        })
        // other view changes
        document.getElementById('currentWaveValue').innerText = `Волна ${this.origin.currentWave}`;
        document.getElementById('currentMoneyValue').innerText = `${this.origin.earnedMoney} гривень`;
        this.drawBaseHP();
        this.drawTowersInInfoPanel();
        this.mergeButton.innerText = `Merge! (${this.origin.mergeCost} гривень)`
    }

    transformModelToCanvasCoords(coords) {
        return { X: coords.X * 0.8, Y: coords.Y * 0.8 };
    }

    drawTowerOnCanvas(tower) {
        let towerLevel = Math.min(Math.trunc(tower.level), 8);
        let pathBeginPoint = this.transformModelToCanvasCoords(tower.position);
        let pathCoords = this.transformPath(towerTierPath[towerLevel], tower.currentRotation * Math.PI / 180, 0.7);
        this.context.beginPath();
        this.context.fillStyle = Configs.colors[tower.colorId];
        this.context.moveTo(pathBeginPoint.X + pathCoords[0][0], pathBeginPoint.Y + pathCoords[0][1]);
        for (let i = 0; i < pathCoords.length; i++) {
            this.context.lineTo(pathBeginPoint.X + pathCoords[i][0], pathBeginPoint.Y + pathCoords[i][1]);
        }
        this.context.closePath();
        this.context.strokeStyle = '#000';
        this.context.fill();
        this.context.stroke();
    }

    drawEnemyOnCanvas(enemy) {
        let pathBeginPoint = this.transformModelToCanvasCoords(enemy.position);
        this.context.beginPath();
        this.context.moveTo(pathBeginPoint.X - 20, pathBeginPoint.Y - 40);
        let hpCoefficient = enemy.healthPoints / enemy.maxHP;
        let deltaX = Math.trunc(40 * (hpCoefficient)) - 20
        this.context.lineTo(pathBeginPoint.X  + deltaX, pathBeginPoint.Y - 40);
        this.context.closePath();
        this.context.strokeStyle = `rgb(${Math.trunc(255 * (1 - hpCoefficient))}, ${Math.trunc(255 * hpCoefficient)}, 0)`;
        this.context.closePath();
        this.context.stroke();

        let pathCoords = this.transformPath(enemyTierPath[enemy.level], enemy.currentRotation * Math.PI / 180, 0.5);
        this.context.beginPath();
        this.context.fillStyle = Configs.colors[enemy.colorId];
        this.context.moveTo(pathBeginPoint.X + pathCoords[0][0], pathBeginPoint.Y + pathCoords[0][1]);
        for (let i = 0; i < pathCoords.length; i++) {
            this.context.lineTo(pathBeginPoint.X + pathCoords[i][0], pathBeginPoint.Y + pathCoords[i][1]);
        }
        this.context.closePath();
        this.context.strokeStyle = '#000';
        this.context.fill();
        this.context.stroke();
    }

    drawBaseHP() {
        let calculatedLocation = { X: (this.baseLocation[0] + 0.5) * 80, Y: (this.baseLocation[1] + 0.5) * 80 };
        this.context.beginPath();
        this.context.fillStyle = 'white';
        this.context.strokeStyle = 'white';
        this.context.lineWidth = 5;
        this.context.arc(calculatedLocation.X, calculatedLocation.Y, this.progressBarRadius, - Math.PI / 2, - Math.PI / 2 - (2 * Math.PI * this.origin.baseHp / 100), true);
        this.context.font = "20pt Gardens CM";
        let text = `${this.origin.baseHp}`;
        let smallShift = text.length == 2 ? 5 : 0;
        this.context.fillText(text, calculatedLocation.X - 20 + smallShift, calculatedLocation.Y + 8);
        this.context.stroke();
        this.context.lineWidth = 3;
        this.context.strokeStyle = 'black';
    }

    transformPath(towerPath, angle, multiplier) {
        let result = [];
        for (let i = 0; i < towerPath.length; i++) {
            result.push([]);
            let x = (towerPath[i][0] - 50) * multiplier;
            let y = (towerPath[i][1] - 50) * multiplier;
            result[i].push(x * Math.cos(angle) - y * Math.sin(angle));
            result[i].push(x * Math.sin(angle) + y * Math.cos(angle));
        }
        return result;
    }

    drawTowersInInfoPanel() {
        if (this.origin.selectedTowers.length == 0)
            return;
        if (this.origin.selectedTowers.length == 1) {
            let coords = this.origin.selectedTowers[0];
            let tower = this.origin.towerMap.get(coords[0] * 10 + coords[1]);
            this.drawTowerInInfoPanelCanvas(tower, 1);
            return;
        }
        let coords1 = this.origin.selectedTowers[0];
        let coords2 = this.origin.selectedTowers[1];
        let tower1 = this.origin.towerMap.get(coords1[0] * 10 + coords1[1]);
        let tower2 = this.origin.towerMap.get(coords2[0] * 10 + coords2[1]);
        this.drawTowerInInfoPanelCanvas(tower1, 1);
        this.drawTowerInInfoPanelCanvas(tower2, 2);
        this.drawTowerInInfoPanelCanvas(this.origin.towerOnMerge, 3);
    }

    drawTowerInInfoPanelCanvas(tower, frameId) {
        let canvas = document.getElementById(`towerInfoImage${frameId}`);
        let context = canvas.getContext('2d');
        let level = Math.trunc(tower.level);
        let rawPath = towerTierPath[Math.min(level, 8)];
        let towerPath = this.transformPath(rawPath, tower.currentRotation * Math.PI / 180, 1.6);
        context.clearRect(0, 0, 200, 200);
        context.lineWidth = 5;
        context.beginPath();
        context.fillStyle = Configs.colors[tower.colorId];
        context.moveTo(100 + towerPath[0][0], 100 + towerPath[0][1]);
        for (let i = 0; i < towerPath.length; i++) {
            context.lineTo(100 + towerPath[i][0], 100 + towerPath[i][1]);
        }
        context.closePath();
        context.strokeStyle = '#000';
        context.fill();
        context.stroke();

        let towerDataContainer = document.getElementById(`towerInfoData${frameId}`);
        let towerData = {
            level: Math.trunc(tower.level * 10) / 10,
            damage: Math.trunc(tower.calculateRawDamage()),
        }
        towerDataContainer.innerHTML = `Level : ${towerData.level}<br>Damage : ${towerData.damage}`;
    }

    tileToClassDictionary = {
        'e': 'emptyTile',
        'r': 'roadTile',
        't': 'towerTile',
        's': 'spawnTile',
        'b': 'baseTile'
    }
}

class GameController {
    constructor(modelInfo) {
        this.origin = modelInfo;
        let tileMap = modelInfo.mapData.map;
        for (let y = 0; y < tileMap.length; y++)
            for (let x = 0; x < tileMap[y].length; x++)
                if (tileMap[y][x] == Configs.towerTile)
                    document.getElementById(`tile_${x}_${y}`).addEventListener('click', () => { this.selectTower(x, y) })
            
        document.getElementById('towerMergeButton').addEventListener('click', () => { this.origin.mergeTowers() });
    }

    selectTower(x, y) {
        let activeTowers = this.origin.selectedTowers;
        for (let i = 0; i < activeTowers.length; i++)
            if (activeTowers[i][0] == x && activeTowers[i][1] == y)
                return;
        if (activeTowers.length == 2) {
            document.getElementById(`tile_${activeTowers[0][0]}_${activeTowers[0][1]}`).style.backgroundColor = '#888';
            activeTowers.shift();
        }
        activeTowers.push([x, y]);
        document.getElementById(`tile_${x}_${y}`).style.backgroundColor = '#ccc';
    }
}

class Game {
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