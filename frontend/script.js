import { towerTierPath, enemyTierPath } from './geometry.js';
import { getRandomInt, countNextLevel, countColorOnAbsorb, countDamageMultiplier, calculateSegmentAngle } from './mathModule.js';
import * as Configs from './configs.js';

let mapPage = 0;
let username = 'username';
let score = 0;
let mapId = 0;
let pageFocused = true;

const gameStages = [
    'pregame',
    'game',
    'aftergame'
]

let currentGameStage = 1;
let lastKnownGameStage = 0;

let game = undefined;

document.addEventListener('DOMContentLoaded', init);

function init() {
    let usernameCookie = getCookie('username');
    if (usernameCookie)
        document.getElementById('usernameField').value = usernameCookie;
    document.getElementById('confirmUsername').addEventListener('click', saveUsernameInCookies);

    document.addEventListener('focus', () => {pageFocused = true});
    document.addEventListener('blur', () => {pageFocused = false});

    document.getElementById('startNewGame').addEventListener('click',  () => { currentGameStage = 1; });

    mainloop();
}

// обновляется 50 раз в секунду
function mainloop() {
    console.log(currentGameStage);
    if (currentGameStage == lastKnownGameStage == 1) {
        game.update(1000 / Configs.fps)
    } else {
        switch (currentGameStage) {
            case 0:
                makeScreenVisible('pregame');
                break;
            case 1:
                makeScreenVisible('game');
                game = new Game(tempMap);
                game.update(1000 / Configs.fps);
                if (game.gameEnded) {
                    lastKnownGameStage = currentGameStage;        
                    currentGameStage = (currentGameStage + 1) % 3;
                }
                break;
            case 2:
                makeScreenVisible('aftergame');
                break;
            default:
                break;
        }    
    }
    lastKnownGameStage = currentGameStage;
    let timer = setTimeout(mainloop, 1000 / Configs.fps);
}

function makeScreenVisible(screenId) {
    document.getElementById('pregame').style.visibility = 'hidden';
    document.getElementById('game').style.visibility = 'hidden';
    document.getElementById('aftergame').style.visibility = 'hidden';
    document.getElementById(screenId).style.visibility = 'hidden';
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
    return;
}

//TODO: отрисовка страницы с картами на стартовом экране
function drawMaps(mapList) {
    return;
}

class TowerModel {
    constructor(mapX, mapY) {
        this.position = {
            tileX: mapX, // TILE
            tileY: mapY, // TILE 
            X: mapX * Configs.tileLengthMultipier + Configs.tileLengthMultipier / 2, // CONVENTIONAL UNITS
            Y: mapY * Configs.tileLengthMultipier + Configs.tileLengthMultipier / 2 // CONVENTIONAL UNITS
        }
        this.level = 1;
        this.currentRotation = 0; // DEGREES
        this.targetRotation = 0; // DEGREES
        this.rotationSpeed = 0.25; // DEGREES / MILLIS
        this.confidenceRange = 5; // DEGREES, TOWER WILL SHOOT AT ENEMY IF IT IS WHITHIN THIS RANGE IN DEGREES
        this.currentTarget = null; // ENEMY MODEL
        this.colorId = getRandomInt(0, Configs.colors.length);
    }

    calculateRawDamage() {
        return this.level * 15;
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
            this.currentTarget.receiveDamage(countDamageMultiplier(this.colorId, this.currentTarget.colorId, Configs.colors.length));
            laserRayList.push({
                from: this.position,
                to: this.currentTarget.position,
                colorId: this.colorId
            });
            if (!this.currentTarget.isAlive && !this.currentTarget.towerLevelledUp)
                this.level *= 1.01;
                this.currentTarget.towerLevelledUp = true;
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
            let dx = currentEnemy.position.X - this.position.X;
            let dy = currentEnemy.position.Y - this.position.Y;
            let currentDistance = Math.hypot(dx, dy);
            if (currentDistance < Configs.towerDistanceArea) {
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
    constructor(waypoints, colorId, level) {
        this.maxHP = 200 * level;
        this.healthPoints = 200 * level;
        this.colorId = colorId;
        this.isAlive = true;
        this.waypoints = [];
        waypoints.forEach(waypoint => {
            this.waypoints.push({
                X: waypoint.X * Configs.tileLengthMultipier + Math.trunc(Configs.tileLengthMultipier / 2),
                Y: waypoint.Y * Configs.tileLengthMultipier + Math.trunc(Configs.tileLengthMultipier / 2)
            });
        })
        this.position = this.waypoints[0];
        this.targetPosition = this.waypoints[1];
        this.nextWaypoint = 1;
        this.speed = 1 / 5; // CONVENTIONAL UNITS / MILLIS
        this.reachedBase = false;
        this.currentRotation = 0;
        this.level = level;
        this.towerLevelledUp = false;
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
        this.towerMap = new Map();
        this.lastMobSpawn = 0;
        this.recentlyDeletedEnemy = [];
        for (let y = 0; y < mapData.map.length; y++)
            for (let x = 0; x < mapData.map[y].length; x++)
                if (mapData.map[y][x] == Configs.towerTile)
                    this.towerMap.set(x * 10 + y, new TowerModel(x, y));
        this.totalWaveHp = 0;
        this.laserRayList = [];
        this.selectedTowers = [];
        this.towerOnMerge = undefined;
        this.earnedMoney = 0;
        this.mergeCost = 0;
    }

    calculateBaseLocation() {
        for (let tileY = 0; tileY < 10; tileY++)
            for (let tileX = 0; tileX < 10; tileX++)
                if (this.mapData.map[tileY][tileX] == 'b')
                    return [tileX, tileY];
    }

    generateWave() {
        let enemyWaveColor = getRandomInt(0, Configs.colors.length);
        let enemyLevel = Math.min(Math.trunc((this.currentWave + 2) / 4) + 1, 8);
        let enemyCount = Math.trunc(this.currentWave / 4) + 3;
        for (let i = 0; i < enemyCount; i++)
            this.enemyQueue.push(new EnemyModel(this.mapData.waypoints, enemyWaveColor, enemyLevel));
    }

    update(deltaTime) {
        if (!pageFocused) {
            /* TODO: наблюдается баг со спавном моба, если очередь мобов не пуста, а игрок уходит на другую
            вкладку, а то, что сделано сейчас - быстрофикс, но потом, при наличии времени, следует разобраться*/
            return;
        }
        this.laserRayList = [];
        this.activeEnemyList.forEach(enemy => enemy.update(deltaTime));
        this.towerMap.forEach((tower, coords, map) => tower.selectEnemy(this.activeEnemyList));
        this.towerMap.forEach((tower, coords, map) => tower.update(deltaTime, this.laserRayList));

        // update enemyList by removing dead enemies and those, who reached base
        let updatedEnemyList = [];
        this.activeEnemyList.forEach((enemy) => {
            if (!enemy.isAlive) {
                this.recentlyDeletedEnemy.push(enemy);
                this.earnedMoney += 3 * enemy.level;
            }
            else if (enemy.reachedBase) {
                this.recentlyDeletedEnemy.push(enemy);
                this.baseHp--;
            } else {
                updatedEnemyList.push(enemy);
            }
        })
        this.activeEnemyList = updatedEnemyList;

        // generating new wave, if needed
        if (this.enemyQueue.length == 0 && this.activeEnemyList.length == 0) {
            this.generateWave();
            this.earnedMoney += 10 * this.currentWave;
            this.currentWave++;
        }
        if (this.enemyQueue.length > 0 && this.lastMobSpawn > Configs.ticksBetweenMobs) {
            this.activeEnemyList.push(this.enemyQueue.shift());
            this.lastMobSpawn = 0;
        }

        // calculating waveHP, might be useful
        this.totalWaveHp = 0;
        for (let i = 0; i < this.activeEnemyList.length; i++)
            this.totalWaveHp += this.activeEnemyList[i].healthPoints;
        for (let i = 0; i < this.enemyQueue.length; i++)
            this.totalWaveHp += this.enemyQueue[i].healthPoints;
        if (this.selectedTowers.length == 2) {
            this.towerOnMerge = this.getTowerOnMerge();
            this.mergeCost = Math.trunc(this.towerOnMerge.level * 10);
        }

        this.lastMobSpawn++;
    }

    mergeTowers() {
        if (this.selectedTowers.length != 2)
            return;
        if (this.earnedMoney < this.mergeCost)
            return
        this.earnedMoney -= this.mergeCost;
        let firstKey = this.selectedTowers[0][0] * 10 + this.selectedTowers[0][1];
        let secondKey = this.selectedTowers[1][0] * 10 + this.selectedTowers[1][1];
        let towers = [this.towerMap.get(firstKey), this.towerMap.get(secondKey)];
        let minLevelTower = towers[0];
        let maxLevelTower = towers[1];
        if (minLevelTower.level > maxLevelTower.level) {
            minLevelTower = towers[1];
            maxLevelTower = towers[0];
            let temp = firstKey;
            firstKey = secondKey;
            secondKey = temp;
        }
        this.towerMap.delete(firstKey);
        this.towerMap.set(firstKey, new TowerModel(minLevelTower.position.tileX, minLevelTower.position.tileY));
        this.towerMap.delete(secondKey);
        this.towerOnMerge.currentRotation = maxLevelTower.currentRotation;
        this.towerMap.set(secondKey, this.towerOnMerge);
    }

    getTowerOnMerge() {
        let firstKey = this.selectedTowers[0][0] * 10 + this.selectedTowers[0][1];
        let secondKey = this.selectedTowers[1][0] * 10 + this.selectedTowers[1][1];
        let towers = [this.towerMap.get(firstKey), this.towerMap.get(secondKey)];
        let minLevelTower = towers[0];
        let maxLevelTower = towers[1];
        if (minLevelTower.level > maxLevelTower.level) {
            minLevelTower = towers[1];
            maxLevelTower = towers[0];
            let temp = firstKey;
            firstKey = secondKey;
            secondKey = temp;
        }
        let maxTowerPosition = [maxLevelTower.position.tileX, maxLevelTower.position.tileY];
        let newTower = new TowerModel(maxTowerPosition[0], maxTowerPosition[1]);
        newTower.level = countNextLevel(maxLevelTower.level, minLevelTower.level);
        newTower.colorId = countColorOnAbsorb(maxLevelTower.colorId, minLevelTower.colorId, Configs.colors.length);
        return newTower;
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

    update(deltaTime) {
        if (this.gameEnded)
            return;
        this.model.update(deltaTime);
        this.view.update();
        this.gameEnded = !(this.model.baseHp > 0);
    }
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