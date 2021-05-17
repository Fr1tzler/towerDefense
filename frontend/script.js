import {towerTierClipPath, enemyTierClipPath} from './geometry.js';
import {getRandomInt, countNextLevel, countColorOnAbsorb, countDamageMultiplier} from './mathModule.js';

let mapPage = 0;
let username = 'username';
let score = 0;
let mapId = 0;
const tileLengthMultipier = 100;
const towerDistanceArea = 2500000;
const fps = 10;
const towerTile = 't';
const mobSpawningInterval = 600; // mob spawn interval in milliseconds
const groupSpawnInterval = 5000; // milliseconds between last mob killed and new group spawn
const gameStages = [
    'pregame',
    'game',
    'aftergame'
]
let currentGameStage = 0;


document.addEventListener('DOMContentLoaded', init);

function init() {
    // TODO: если такой куки нет, делать значение просто 'username'
    document.getElementById('usernameField').value = getCookie('username');
    document.getElementById('confirmUsername').addEventListener('click', saveUsernameInCookies);

    let game = new Game(tempMap);
    let timer = setInterval(mainloop, 1000 / fps, game)
}

function mainloop(game) {
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
    for (let cookieId = 0; cookieId < cookieArray.length; cookieId++) {
        var cookie = cookieArray[cookieId];
        while (cookie.charAt(0) == ' ') cookie = cookie.substring(1, cookie.length);
        if (cookie.indexOf(cookieName) == 0) return cookie.substring(cookieName.length, cookie.length);
    }
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

class TowerModel {
    constructor(mapX, mapY) {
        this.position = {
            X: mapX, // TILE
            Y: mapY, // TILE 
            realX: mapX * tileLengthMultipier, // CONVENTIONAL UNITS
            realY: mapY * tileLengthMultipier // CONVENTIONAL UNITS
        }
        this.level = 1;
        this.currentRotation = 0; // DEGREES
        this.targetRotation = 0; // DEGREES
        this.rotationSpeed = 100; // DEGREES / SEC(???)
        this.confidenceRange = 10; // DEGREES, TOWER WILL SHOOT AT ENEMY IF IT IS WHITHIN THIS RANGE IN DEGREES
        this.currentTarget = null; // ENEMY MODEL
        this.colorId = getRandomInt(0, colors.length);
    }

    getDamage() {
        return this.level * 10;
    }

    update(deltaTime) {
        // ROTATING TOWER FIRST
        let deltaRotation = this.targetRotation - this.currentRotation;
        if (Math.abs(deltaRotation) <= 180) {
            if (Math.abs(deltaRotation) <= this.rotationSpeed * deltaTime) {
                this.currentRotation = this.targetRotation;
            } else {
                this.currentRotation += Math.sign(deltaRotation) * deltaTime;
            }
        } else {
            if (Math.abs(360 - deltaRotation) <= this.rotationSpeed * deltaTime) {
                this.currentRotation = this.targetRotation;
            } else {
                if (deltaRotation > 0) {
                    this.currentRotation = (this.currentRotation - this.rotationSpeed * deltaTime + 360) % 360;
                } else {
                    this.currentRotation = (this.currentRotation + this.rotationSpeed * deltaTime) % 360;
                }
            }
        }

        if (this.currentTarget == undefined)
            return;
        // FIRING AT ENEMY IF POSSIBLE
        if (Math.abs(deltaRotation) < this.confidenceRange)
            this.currentTarget.receiveDamage(countDamageMultiplier(this.colorId, this.currentTarget.color, colors.length));
    }

    selectEnemy(enemyList) {
        if (enemyList.length == 0)
            return;
        
        // SEARCHING FOR NEAREST ENEMY
        let nearestEnemy = enemyList[0];
        let currentDistance = Math.hypot(this.position.realX - nearestEnemy.position.X, this.position.realY - nearestEnemy.position.Y);
        let minimalDistance = currentDistance;
        for (let enemyId = 0; enemyId < enemyList.length; enemyId++) {
            let currentEnemy = enemyList[enemyId];
            let currentDistance = Math.hypot(this.position.realX - currentEnemy.position.X, this.position.realY - currentEnemy.position.Y);
            if (currentDistance < minimalDistance) {
                minimalDistance = currentDistance;
                nearestEnemy = currentEnemy;
            }
        }

        if (minimalDistance > towerDistanceArea) {
            this.currentTarget = null;
        } else {
            this.currentTarget = nearestEnemy;
        }
        // COUNTING REQUIRED ROTATION
        // TODO:
    }
}

class EnemyModel {
    constructor(waypoints, color) {
        this.healthPoints = 100;
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
        this.speed = 1 / 5; // FIXME: RIGHT FUCKING NOW
        this.reachedBase = false;
        this.rotation = 0; // TODO: use later
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
                this.rotation = 90;
            }
            else {
                this.position.X = Math.max(this.position.X - deltaTime * this.speed, this.targetPosition.X);
                this.rotation = 270;
            }
        } else {
            if (deltaPosition.Y > 0) {
                this.position.Y = Math.min(this.position.Y + deltaTime * this.speed, this.targetPosition.Y);
                this.rotation = 180;
            }
            else {
                this.position.Y = Math.max(this.position.Y - deltaTime * this.speed, this.targetPosition.Y);
                this.rotation = 0;
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
        for (let y = 0; y < 10; y++)
            for (let x = 0; x < 10; x++)
                if (mapData.map[y][x] == towerTile)
                    this.towerList.push(new TowerModel(x, y));
    }

    generateWave() {
        let enemyColor = getRandomInt(0, colors.length);
        for (let i = 0; i < 3 + Math.trunc(this.currentWave / 2); i++)
            this.enemyQueue.push(new EnemyModel(this.mapData.waypoints, enemyColor));
    }

    update(deltaTime) {
        // апдейтим положение врагов и башен
        this.activeEnemyList.forEach(enemy => enemy.update(deltaTime));
        // TODO: сделать так, чтобы башни крутились в сторону первого из доступных мобов и при подходящем угле вели огонь
        this.towerList.forEach(tower => tower.selectEnemy(this.activeEnemyList));
        this.towerList.forEach(tower => tower.update(deltaTime));

        // обновляем activeEnemyList, убирая убитых или достигших базы, в случае, если такие есть
        let enemyChangedStateCount = 0;
        this.activeEnemyList.forEach(enemy => {
            if (!enemy.isAlive || enemy.reachedBase)
                enemyChangedStateCount++;
        });
        if (enemyChangedStateCount != 0) {
            let newMobList = [];
            for (let enemyId = 0; enemyId < this.activeEnemyList.length; enemyId++) {
                let enemy = this.activeEnemyList[enemyId];
                if (!enemy.isAlive) {
                    this.recentlyDeletedEnemy.push(enemy);
                    continue;
                }
                if (enemy.reachedBase) {
                    this.recentlyDeletedEnemy.push(enemy);
                    this.baseHp--;
                    continue;
                }
                newMobList.push(enemy);
            }
            this.activeEnemyList = newMobList;
        }

        // апдейтим волну, если предыдущая закончена и прошло достаточно времени
        if (this.enemyQueue.length == 0 && this.activeEnemyList.length == 0 && (new Date() - this.lastGroupSpawnTime > groupSpawnInterval)) {
            this.generateWave();
            this.currentWave++;
            this.lastGroupSpawnTime = new Date();
        }

        // если со спавна последнего моба прошло достаточно времени, и очередь не пуста, генерим нового моба на спавне
        if (this.enemyQueue.length > 0 && (new Date - this.lastMobSpawnTime > mobSpawningInterval)) {
            this.activeEnemyList.push(this.enemyQueue.shift());
            this.lastMobSpawnTime = new Date();
        }
    }
}

class TowerView {
    constructor(mapX, mapY, colorId) {
        this.self = document.createElement('div');
        this.inner = document.createElement('div');
        this.self.className = 'tower';
        this.inner.className = 'towerInner';
        this.self.style.clipPath = towerTierClipPath[1];
        this.inner.style.clipPath = towerTierClipPath[1];
        this.inner.style.backgroundColor = colors[colorId];
        document.getElementById(`tile_${mapX}_${mapY}`).appendChild(this.self);
        this.self.appendChild(this.inner);
    }

    setTier(tier) {
        let truncatedTier = Math.trunc(tier);
        this.self.style.clipPath = towerTierClipPath[truncatedTier];
        this.inner.style.clipPath = towerTierClipPath[truncatedTier];
    }

    update(towerModel) {
        this.self.style.transform = "translate(-50%, -50%);"
        this.self.style.transform += `rotate(${towerModel.currentRotation}deg)`
        // TODO: add rotation
    }
}

class EnemyView {
    constructor(enemyModel) {
        this.self = document.createElement('div');
        this.inner = document.createElement('div');
        this.self.className = 'enemy';
        this.inner.className = 'enemyInner';

        this.self.style.clipPath = enemyTierClipPath[8];
        this.inner.style.clipPath = enemyTierClipPath[8];
        this.inner.style.backgroundColor = colors[enemyModel.color];
        let tileScreen = document.getElementById('tileScreen');

        this.mapSize = { X: 800, Y: 800 };
        this.paddingSize = 20;

        let truePosition = this.transformPosition(enemyModel.position, this.mapSize, this.paddingSize);
        tileScreen.appendChild(this.self);
        this.self.appendChild(this.inner);
        this.self.style.left = `${truePosition.X}px`;
        this.self.style.top = `${truePosition.Y}px`;
    }

    update(enemyModel) {
        let truePosition = this.transformPosition(enemyModel.position, this.mapSize, this.paddingSize);
        this.self.style.left = `${truePosition.X}px`;
        this.self.style.top = `${truePosition.Y}px`;
        this.self.style.transform = 'translate(-50%, -50%)';
        this.self.style.transform += `rotate(${enemyModel.rotation}deg`;
    }

    transformPosition(modelPosition, mapSize, padding) {
        return {
            X: modelPosition.X * mapSize.X / 1000 + padding,
            Y: modelPosition.Y * mapSize.Y / 1000 + padding
        };
    }

    remove() {
        this.self.remove();
    }
}

class GameView {
    constructor(modelInfo) {
        // tile generation
        let tileScreen = document.getElementById('tileScreen');
        for (let y = 0; y < 10; y++) {
            let row = document.createElement('div');
            row.className = 'tileRow';
            tileScreen.appendChild(row);
            for (let x = 0; x < 10; x++) {
                let tile = document.createElement('div');
                tile.className = 'tile ';
                tile.className += tileToClassDictionary[tempMap.map[y][x]];
                tile.id = `tile_${x}_${y}`;
                row.appendChild(tile);
            }
        }

        // tower generation
        this.towerList = [];
        for (let towerId = 0; towerId < modelInfo.towerList.length; towerId++) {
            let tower = modelInfo.towerList[towerId];
            this.towerList.push(new TowerView(tower.position.X, tower.position.Y, tower.colorId))
        }
        this.enemyList = new Map();
    }

    update(modelInfo) {
        for (let enemyId = 0; enemyId < modelInfo.activeEnemyList.length; enemyId++) {
            let currentEnemy = modelInfo.activeEnemyList[enemyId];
            if (this.enemyList.get(currentEnemy)) {
                this.enemyList.get(currentEnemy).update(currentEnemy);
            } else {
                this.enemyList.set(currentEnemy, new EnemyView(currentEnemy));
            }
        }
        for (let deletedEnemyId = 0; deletedEnemyId < modelInfo.recentlyDeletedEnemy.length; deletedEnemyId++) {
            let currentEnemy = modelInfo.recentlyDeletedEnemy[deletedEnemyId];
            this.enemyList.get(currentEnemy).remove()
            this.enemyList.delete(currentEnemy);
        }
        modelInfo.recentlyDeletedEnemy = [];
        this.updateProgressBar(modelInfo.baseHp);
    }

    updateProgressBar(baseHp) {
        document.getElementById('progressBarText').innerText = `${baseHp}/100`
        document.getElementById('progressBarLine').style.right = `${100-baseHp}%`;
    }
}

class Game {
    constructor(mapData) {
        this.model = new GameModel(mapData);
        this.view = new GameView(this.model);
    }

    update(deltaTime) {
        this.model.update(deltaTime);
        this.view.update(this.model);
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
        ['e', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'r', 'e'],
        ['e', 'r', 't', 't', 't', 't', 't', 't', 'r', 'e'],
        ['e', 'r', 't', 'e', 'e', 'e', 'e', 't', 'r', 'e'],
        ['e', 'r', 't', 'e', 'e', 'e', 'e', 't', 'r', 'e'],
        ['e', 'r', 't', 'e', 'e', 'e', 'e', 't', 'r', 'e'],
        ['e', 'r', 't', 'e', 'e', 'e', 'e', 't', 'r', 'e'],
        ['e', 'r', 't', 'e', 'e', 'e', 'e', 't', 'r', 'e'],
        ['e', 'r', 't', 'e', 'e', 'e', 'e', 't', 'r', 'e'],
        ['e', 'b', 'e', 'e', 'e', 'e', 'e', 'e', 's', 'e']
    ],
    waypoints: [
        { X: 8, Y: 9 },
        { X: 8, Y: 1 },
        { X: 1, Y: 1 },
        { X: 1, Y: 9 },
    ]
}