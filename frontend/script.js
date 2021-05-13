let mapPage = 0;
let username = 'username';
let score = 0;
let mapId = 0;
const tileLengthMultipier = 100;
const towerDistanceArea = 250;
const fps = 50;
const towerTile = 't';
const mobSpawningInterval = 1000; // mob spawn interval in milliseconds
const groupSpawnInterval = 10000; // milliseconds between last mob killed and new group spawn
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
    let timer = setInterval(mainloop, 1000/fps, game)
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

const towerTierClipPath = {
    1: 'polygon(50% 0%, 80% 80%, 20% 80%)',
    2: 'polygon(50% 0%, 80% 80%, 80% 90%, 20% 90%, 20% 80%)',
    3: 'polygon(50% 0%, 80% 80%, 70% 90%, 50% 80%, 30% 90%, 20% 80%)',
    4: 'polygon(50% 0%, 80% 70%, 60% 70%, 50% 90%, 40% 70%, 20% 70%)',
    5: 'polygon(50% 0%, 70% 50%, 80% 30%, 80% 60%, 50% 80%, 20% 60%, 20% 30%, 30% 50%)',
    6: 'polygon(50% 0%, 70% 50%, 80% 30%, 80% 90%, 70% 70%, 50% 90%, 30% 70%, 20% 90%, 20% 30%, 30% 50%)',
    7: 'polygon(50% 0%, 70% 50%, 70% 20%, 60% 10%, 80% 20%, 80% 60%, 50% 90%, 20% 60%, 20% 20%, 40% 10%, 30% 20%, 30% 50%)',
    8: 'polygon(50% 0%, 70% 50%, 70% 30%, 60% 10%, 90% 40%, 80% 80%, 70% 70%, 50% 100%, 30% 70%, 20% 80%, 10% 40%, 40% 10%, 30% 30%, 30% 50%)'
}

const enemyTierClipPath = {
    1 : 'polygon(50% 0%, 80% 80%, 20% 80%)',
    2 : 'polygon(50% 0%, 80% 80%, 50% 100%, 20% 80%)',
    3 : 'polygon(50% 0%, 70% 60%, 90% 70%, 70% 80%, 50% 100%, 30% 80%, 10% 70%, 30% 60%)',
    4 : 'polygon(50% 0%, 80% 60%, 100% 70%, 80% 80%, 80% 90%, 20% 90%, 20% 80%, 0% 70%, 20% 60%)',
    5 : 'polygon(50% 0%, 80% 60%, 100% 60%, 100% 70%, 50% 100%, 0% 70%, 0% 60%, 20% 60%)',
    6 : 'polygon(50% 0%, 70% 60%, 90% 50%, 90% 70%, 50% 100%, 10% 70%, 10% 50%, 30% 60%)',
    7 : 'polygon(50% 0%, 70% 60%, 90% 50%, 70% 80%, 70% 90%, 30% 90%, 30% 80%, 10% 60%, 10% 50%, 30% 60%)',
    8 : 'polygon(50% 0%, 70% 60%, 80% 50%, 80% 40%, 90% 30%, 90% 60%, 70% 80%, 70% 100%, 60% 90%, 40% 90%, 30% 100%, 30% 80%, 10% 60%, 10% 30%, 20% 40%, 20% 50%, 30% 60%)'
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

function countNextLevel(absorberTowerLevel, eatedTowerLevel) {
    return absorberTowerLevel + eatedTowerLevel / absorberTowerLevel;
}

// TODO:
function countColorOnAbsorb(absorberColorId, eatedColorId) {
    return 1;
}

// TODO:
function countDamageMultiplier(towerColorId, enemyColorId) {
    return 1;
}

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
            X: mapX,
            Y: mapY,
            realX: mapX * tileLengthMultipier,
            realY: mapY * tileLengthMultipier
        }
        this.level = 1;
        this.currentRotation = 0;
        this.currentTarget = null;
        this.colorId = getRandomInt(0, colors.length);
    }

    getDamage() {
        return this.level * 100;
    }

    update(deltaTime) {

    }
}

class EnemyModel {
    constructor(waypoints, color) {
        this.healthPoints = 100;
        this.color = color
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
        this.speed = 1 / 100;
        this.reachedBase = false;
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
        // TODO: упрость движение, поскольку оно происходит только по вертикали горизонтали, сложная функция не нужна
        // TODO: добавть поворот согласно направлению движения
        let deltaDistance = Math.hypot(deltaPosition.X, deltaPosition.Y);
        let distanceRatio = Math.min(1, deltaTime * this.speed / deltaDistance);
        this.position.X += deltaPosition.X * distanceRatio;
        this.position.Y += deltaPosition.Y * distanceRatio;
        if (distanceRatio == 1) {
            this.nextWaypoint++;
            if (this.nextWaypoint = this.waypoints.length)
                this.reachedBase = true;
            else
                this.targetPosition = this.waypoints[this.nextWaypoint];
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
                    continue;
                }
                if (enemy.reachedBase) {
                    this.baseHp--;
                    continue;
                }
                newMobList.push(enemy);
            }
            this.activeEnemyList = newMobList;    
        }

        // апдейтим волну, если предыдущая закончена и прошло достаточно времени
        if (this.enemyQueue.length == 0 && (new Date() - this.lastGroupSpawnTime > groupSpawnInterval)) {
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
}

class EnemyView {
    constructor(position, colorId) {
        this.self = document.createElement('div');
        this.inner = document.createElement('div');
        this.self.className = 'enemy';
        this.inner.className = 'enemyInner';

        this.self.style.clipPath = enemyTierClipPath[8];
        this.inner.style.clipPath = enemyTierClipPath[8];
        this.inner.style.backgroundColor = colors[colorId];

        let tileScreen = document.getElementById('tileScreen');
        
        // FIXME: чет очень страшно выглядит, посмотреть позже.
        let paddingSize = window.getComputedStyle(tileScreen).paddingLeft;
        console.log(paddingSize + '');
        let tileScreenSize = {X: tileScreen.offsetWidth - 2 * paddingSize, Y: tileScreen.offsetHeight - 2 * paddingSize}; 
        document.getElementById('tileScreen').appendChild(this.self);
        this.self.appendChild(this.inner);

        let realPosition = this.transformPosition(position, tileScreenSize, paddingSize);
        alert(realPosition.X);
        this.self.style.left = `${Math.trunc(realPosition.X)}px`;
        this.self.style.top = `${Math.trunc(realPosition.Y)}px`;
    }

    update() {
        // TODO:
    }

    // TODO:
    transformPosition(modelPosition, mapSize, padding) {
        return {
            X: modelPosition.X * mapSize.X / 1000 + padding,
            Y: modelPosition.Y * mapSize.Y / 1000 + padding
        };
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

        let a = new EnemyView({X: 850, Y: 950}, 3);
    }

    update(modelInfo) {
        // TODO: enemy spawn(with resize) & movement(with rotation)
        // TODO: tower rotation
        // TODO: laser rays from toer to enemy
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
        {X : 8, Y: 9},
        {X : 8, Y: 1},
        {X : 1, Y: 1},
        {X : 1, Y: 9},
    ]
}