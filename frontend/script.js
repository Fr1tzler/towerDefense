// FIXME: при переключении на другую вкладку всё ломается
import { towerTierPath } from './geometry.js';
import { getRandomInt, countNextLevel, countColorOnAbsorb, countDamageMultiplier, calculateSegmentAngle } from './mathModule.js';

let mapPage = 0;
let username = 'username';
let score = 0;
let mapId = 0;

const mapSizePx = 800;
const paddingSizePx = 10;

const tileLengthMultipier = 100;
const towerDistanceArea = 400;
const fps = 50;
const towerTile = 't';
const mobSpawningInterval = 800; // mob spawn interval in milliseconds
const groupSpawnInterval = 2000; // milliseconds between last mob killed and new group spawn
const gameStages = [
    'pregame',
    'game',
    'aftergame'
]
let currentGameStage = 0;

document.addEventListener('DOMContentLoaded', init);

function init() {
    let usernameCookie = getCookie('username');
    if (usernameCookie)
        document.getElementById('usernameField').value = usernameCookie;
    document.getElementById('confirmUsername').addEventListener('click', saveUsernameInCookies);

    let game = new Game(tempMap);
    let timer = setInterval(mainloop, 1000 / fps, game)
}

function mainloop(game) {
    if (game.gameEnded)
        return;
    game.update(1000 / fps);
}

const colors = [
    '#FF3C00', // orangered
    '#F79A00', // orange
    '#F2C500', // orangeyellow
    '#F0FF00', // yellow
    '#BAFF00', // yellowgreen
    '#4CBE2C', // green
    '#2F77CF', // lightblue
    '#5700FF', // blue
    '#53009F', // violetblue
    '#9000AD', // violet
    '#A4003D', // cherry
    '#FF0000', // red
];

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
    return;
}

//TODO: отрисовка страницы с картами на стартовом экране
function drawMaps(mapList) {
    return;
}

class TowerModel {
    constructor(mapX, mapY) {
        this.position = {
            X: mapX, // TILE
            Y: mapY, // TILE 
            realX: mapX * tileLengthMultipier + tileLengthMultipier / 2, // CONVENTIONAL UNITS
            realY: mapY * tileLengthMultipier + tileLengthMultipier / 2 // CONVENTIONAL UNITS
        }
        this.level = 1;
        this.currentRotation = 0; // DEGREES
        this.targetRotation = 0; // DEGREES
        this.rotationSpeed = 0.25; // DEGREES / MILLIS
        this.confidenceRange = 5; // DEGREES, TOWER WILL SHOOT AT ENEMY IF IT IS WHITHIN THIS RANGE IN DEGREES
        this.currentTarget = null; // ENEMY MODEL
        this.colorId = getRandomInt(0, colors.length);
    }

    getDamage() {
        return this.level * 10;
    }

    update(deltaTime, laserRayList) {
        if (this.currentTarget == undefined)
            return;
        let deltaRotation = this.targetRotation - this.currentRotation;
        if (Math.abs(deltaRotation) > 180)
            deltaRotation -= Math.sign(deltaRotation) * 360;
        this.currentRotation += Math.sign(deltaRotation) * Math.min(this.rotationSpeed * deltaTime, Math.abs(deltaRotation));
        let remainingRotation = this.targetRotation - this.currentRotation;
        if (Math.abs(remainingRotation) > 180)
            remainingRotation -= Math.sign(remainingRotation) * 360;
        if (Math.abs(remainingRotation) < this.confidenceRange) {
            this.currentTarget.receiveDamage(countDamageMultiplier(this.colorId, this.currentTarget.color, colors.length));
            laserRayList.push({
                from: {
                    X: this.position.realX,
                    Y: this.position.realY
                },
                to: this.currentTarget.position,
                colorId: this.colorId
            });
        }
    }

    selectEnemy(enemyList) {
        if (enemyList.length == 0)
            return;
        let selectedEnemy = null;
        let deltaX = 0;
        let deltaY = 0;
        for (let i = 0; i < enemyList.length; i++) {
            let currentEnemy = enemyList[i];
            let dx = currentEnemy.position.X - this.position.realX;
            let dy = currentEnemy.position.Y - this.position.realY;
            let currentDistance = Math.hypot(dx, dy);
            if (currentDistance < towerDistanceArea) {
                selectedEnemy = currentEnemy
                deltaX = dx;
                deltaY = dy;
                break;
            }
        }

        this.currentTarget = selectedEnemy;
        if (selectedEnemy)
            this.targetRotation = calculateSegmentAngle(deltaX, deltaY);
    }
}

class EnemyModel {
    constructor(waypoints, color) {
        this.healthPoints = 300; // TODO: балансные правки
        this.color = color;
        this.isAlive = true;
        this.waypoints = [];
        waypoints.forEach(waypoint => {
            this.waypoints.push({
                X: waypoint.X * tileLengthMultipier + Math.trunc(tileLengthMultipier / 2),
                Y: waypoint.Y * tileLengthMultipier + Math.trunc(tileLengthMultipier / 2)
            });
        })
        this.position = this.waypoints[0];
        this.targetPosition = this.waypoints[1];
        this.nextWaypoint = 1;
        this.speed = 1 / 5; // CONVENTIONAL UNITS / MILLIS
        this.reachedBase = false;
        this.currentRotation = 0;
    }

    receiveDamage(incomingDamage) {
        this.healthPoints = Math.max(0, this.healthPoints - incomingDamage);
        if (this.healthPoints == 0)
            this.isAlive = false;
    }

    update(deltaTime) {
        if (this.reachedBase) return;
        let deltaPosition = {
            X: this.targetPosition.X - this.position.X,
            Y: this.targetPosition.Y - this.position.Y,
        }

        if (deltaPosition.Y == 0) {
            if (deltaPosition.X > 0) {
                this.position.X = Math.min(this.position.X + deltaTime * this.speed, this.targetPosition.X);
                this.currentRotation = 90;
            } else {
                this.position.X = Math.max(this.position.X - deltaTime * this.speed, this.targetPosition.X);
                this.currentRotation = 270;
            }
        } else {
            if (deltaPosition.Y > 0) {
                this.position.Y = Math.min(this.position.Y + deltaTime * this.speed, this.targetPosition.Y);
                this.currentRotation = 180;
            } else {
                this.position.Y = Math.max(this.position.Y - deltaTime * this.speed, this.targetPosition.Y);
                this.currentRotation = 0;
            }
        }
        if (this.position.X == this.targetPosition.X && this.position.Y == this.targetPosition.Y) {
            this.nextWaypoint++;
            if (this.nextWaypoint == this.waypoints.length) {
                this.reachedBase = true;
                this.color = 2;
            } else {
                this.targetPosition = this.waypoints[this.nextWaypoint];
            }
        }
    }
}

class GameModel {
    constructor(mapData) {
        this.waveIncoming = true;
        this.currentWave = 0;
        this.baseHp = 100;
        this.mapData = mapData;
        this.enemyQueue = [];
        this.activeEnemyList = [];
        this.towerList = [];
        this.lastMobSpawnTime = new Date();
        this.lastGroupSpawnTime = new Date();
        this.recentlyDeletedEnemy = [];
        for (let y = 0; y < mapData.map.length; y++)
            for (let x = 0; x < mapData.map[y].length; x++)
                if (mapData.map[y][x] == towerTile)
                    this.towerList.push(new TowerModel(x, y));
        this.totalWaveHp = 0;
        this.laserRayList = [];
        this.selectedTowers = [];
        this.selectedTowersChanged = false;
        this.towerOnMerge = undefined;
        this.deletedTowers = [];
        this.addedTowers = [];
    }

    generateWave() {
        let enemyColor = getRandomInt(0, colors.length);
        for (let i = 0; i < 3 + Math.trunc(this.currentWave / 2); i++)
            this.enemyQueue.push(new EnemyModel(this.mapData.waypoints, enemyColor));
    }

    update(deltaTime) {
        this.laserRayList = [];
        this.activeEnemyList.forEach(enemy => enemy.update(deltaTime));
        this.towerList.forEach(tower => tower.selectEnemy(this.activeEnemyList));
        this.towerList.forEach(tower => tower.update(deltaTime, this.laserRayList));
        let newMobList = [];
        this.activeEnemyList.forEach((enemy) => {
            if (!enemy.isAlive) {
                this.recentlyDeletedEnemy.push(enemy);
            }
            else if (enemy.reachedBase) {
                this.recentlyDeletedEnemy.push(enemy);
                this.baseHp--;
            } else {
                newMobList.push(enemy);
            }
        })
        this.activeEnemyList = newMobList;
        if (this.enemyQueue.length == 0 && this.activeEnemyList.length == 0 && (new Date() - this.lastGroupSpawnTime > groupSpawnInterval)) {
            this.generateWave();
            this.currentWave++;
            this.lastGroupSpawnTime = new Date();
        }
        if (this.enemyQueue.length > 0 && (new Date - this.lastMobSpawnTime > mobSpawningInterval)) {
            this.activeEnemyList.push(this.enemyQueue.shift());
            this.lastMobSpawnTime = new Date();
        }
        
        if (this.selectedTowersChanged) {
            if (this.selectedTowers.length == 2) {
                if (this.selectedTowers[1].level > this.selectedTowers[0].level)
                    this.selectedTowers.reverse();
                this.towerOnMerge = new TowerModel(this.selectedTowers[0].position.X, this.selectedTowers[0].position.Y);
                this.towerOnMerge.level = countNextLevel(this.selectedTowers[0].level, this.selectedTowers[1].level);
                this.towerOnMerge.colorId = countColorOnAbsorb(this.selectedTowers[0].colorId, this.selectedTowers[1].colorId, colors.length);
            }
        }
        
        this.totalWaveHp = 0;
        for (let i = 0; i < this.activeEnemyList.length; i++)
            this.totalWaveHp += this.activeEnemyList[i].healthPoints;
        for (let i = 0; i < this.enemyQueue.length; i++)
            this.totalWaveHp += this.enemyQueue[i].healthPoints;
    }
}

class GameView {
    constructor(modelInfo) {
        this.origin = modelInfo;
        let tileScreen = document.getElementById('tileScreen');
        
        for (let tileY = 0; tileY < 10; tileY++) {
            let row = document.createElement('div');
            row.className = 'tileRow';
            tileScreen.appendChild(row);
            for (let tileX = 0; tileX < 10; tileX++) {
                let tile = document.createElement('div');
                tile.className = 'tile ';
                tile.className += tileToClassDictionary[modelInfo.mapData.map[tileY][tileX]];
                tile.id = `tile_${tileX}_${tileY}`;
                row.appendChild(tile);
            }
        }
        
        let canvas = document.getElementById('laserRayLayer');
        canvas.style.width = '800px';
        canvas.style.height = '800px';
        canvas.style.top = '10px';
        canvas.style.left = '10px';
        this.context = canvas.getContext('2d');
    }

    update() {
        this.context.clearRect(0, 0, 800, 800);
        // drawing laser rays
        this.origin.laserRayList.forEach((currentRay) => {
            let lineFrom = this.transformModelToCanvasCoords(currentRay.from, true);
            let lineTo = this.transformModelToCanvasCoords(currentRay.to, false);
            this.context.strokeStyle = colors[currentRay.colorId];
            this.context.lineWidth = 3;
            this.context.beginPath();
            this.context.moveTo(lineFrom.X, lineFrom.Y);
            this.context.lineTo(lineTo.X, lineTo.Y);
            this.context.closePath();
            this.context.stroke();
        });

        // drawing towers
        this.origin.towerList.forEach((tower) => {
            let towerLevel = Math.trunc(tower.level) + 5;
            let pathBeginPoint = this.transformModelToCanvasCoords({X: tower.position.realX, Y: tower.position.realY});
            let pathCoords = this.transformTowerPath(towerTierPath[towerLevel], tower.currentRotation * Math.PI / 180);
            this.context.beginPath();
            this.context.moveTo(pathBeginPoint.X + pathCoords[0][0], pathBeginPoint.Y + pathCoords[0][1]);
            for (let i = 0; i < pathCoords.length; i++) {
                this.context.lineTo(pathBeginPoint.X + pathCoords[i][0], pathBeginPoint.Y + pathCoords[i][1]);
            }
            this.context.closePath();
            this.context.fillStyle = colors[tower.colorId];
            this.context.strokeStyle = '#000';
            this.context.fill();
            this.context.stroke();
        })
            
        // drawing enemies
        this.origin.activeEnemyList.forEach((enemy) => {

        })

        // other view changes
        this.updateProgressBar();
        document.getElementById('waveHpValue').innerText = `${Math.trunc(this.origin.totalWaveHp * 10) / 10}`
    }

    // FIXME: hardcode alert
    transformModelToCanvasCoords(coords) {
        return { X: coords.X * 0.8, Y: coords.Y * 0.8 };
    }

    transformTowerPath(towerPath, angle) {
        let result = []
        for (let i = 0; i < towerPath.length; i++) {
            result.push([]);
            let x = (towerPath[i][0] - 50) * 0.8;
            let y = (towerPath[i][1] - 50) * 0.8;
            result[i].push(x * Math.cos(angle) - y * Math.sin(angle));
            result[i].push(x * Math.sin(angle) + y * Math.cos(angle));
        }
        return result;
    }

    updateProgressBar() {
        let baseHp = this.origin.baseHp;
        document.getElementById('progressBarText').innerText = `${baseHp}/100`
        document.getElementById('progressBarLine').style.right = `${100 - baseHp}%`;
    }
}

class Game {
    constructor(mapData) {
        this.model = new GameModel(mapData);
        this.view = new GameView(this.model);
        this.gameEnded = false;
    }

    update(deltaTime) {
        if (this.gameEnded)
            return;
        this.model.update(deltaTime);
        this.view.update();
        this.gameEnded = !(this.model.baseHp > 0);
    }
}

const tileToClassDictionary = {
    'e': 'emptyTile',
    'r': 'roadTile',
    't': 'towerTile',
    's': 'spawnTile',
    'b': 'baseTile'
}

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