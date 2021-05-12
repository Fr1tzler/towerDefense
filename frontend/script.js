let mapPage = 0;
let username = 'username';
let score = 0;
let mapId = 0;
const tileLengthMultipier = 100;

const gameStages = [
    'pregame',
    'game',
    'aftergame'
]
let currentGameStage = 0;

document.addEventListener('DOMContentLoaded', init);

function init() {
    let gameModel = new GameModel(tempMap);
    let gameView = new GameView();
    //screenChangingLoop();
    // TODO: если такой куки нет, делать значение просто 'username'
    document.getElementById('usernameField').value = getCookie('username');
    document.getElementById('confirmUsername').addEventListener('click', saveUsernameInCookies);
}

function screenChangingLoop() {
    document.getElementById(gameStages[currentGameStage]).style.opacity = "0";
    document.getElementById(gameStages[currentGameStage]).style.visibility = "hidden";
    currentGameStage = (currentGameStage + 1) % 3;
    document.getElementById(gameStages[currentGameStage]).style.opacity = "1";
    document.getElementById(gameStages[currentGameStage]).style.visibility = "visible";
    setTimeout(screenChangingLoop, 10000);
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

const tierClipPath = {
    1: 'polygon(50% 0%, 80% 80%, 20% 80%)',
    2: 'polygon(50% 0%, 80% 80%, 80% 90%, 20% 90%, 20% 80%)',
    3: 'polygon(50% 0%, 80% 80%, 70% 90%, 50% 80%, 30% 90%, 20% 80%)',
    4: 'polygon(50% 0%, 80% 70%, 60% 70%, 50% 90%, 40% 70%, 20% 70%)',
    5: 'polygon(50% 0%, 70% 50%, 80% 30%, 80% 60%, 50% 80%, 20% 60%, 20% 30%, 30% 50%)',
    6: 'polygon(50% 0%, 70% 50%, 80% 30%, 80% 90%, 70% 70%, 50% 90%, 30% 70%, 20% 90%, 20% 30%, 30% 50%)',
    7: 'polygon(50% 0%, 70% 50%, 70% 20%, 60% 10%, 80% 20%, 80% 60%, 50% 90%, 20% 60%, 20% 20%, 40% 10%, 30% 20%, 30% 50%)',
    8: 'polygon(50% 0%, 70% 50%, 70% 30%, 60% 10%, 90% 40%, 80% 80%, 70% 70%, 50% 100%, 30% 70%, 20% 80%, 10% 40%, 40% 10%, 30% 30%, 30% 50%)'
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
    return 0;
}

// TODO:
function countDamageMultiplier(towerColorId, enemyColorId) {
    return 0;
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

//TODO:
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
        this.color = getRandomInt(0, colors.length);
    }

    getDamage() {
        return this.level * 100;
    }
}

class EnemyModel {
    constructor(waypoints, color) {
        this.healthPoints = 100;
        this.color = color
        this.isAlive = true;
        this.waypoints = waypoints;
        this.position = waypoints[0];
        this.targetPosition = waypoints[1];
        this.nextWaypoint = 1;
        this.speed = 10;
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

// TODO:
class GameModel {
    constructor(mapData) {
        this.waveIncoming = true;
        this.wavesSurvived = 0;
        this.baseHp = 100;
        this.mapData = mapData;
        this.mobList = [];
        this.towerList = [];
        
        for (let y = 0; y < 10; y++) 
            for (let x = 0; x < 10; x++) 
                if (mapData.map[y][x] == towerTile) 
                    this.towerList.push(new TowerModel(x, y));
    }

    generateWave() {
        let mobColor = getRandomInt(o, colors.length);
        for (let i = 0; i < 3 + Math.trunc(this.wavesSurvived / 2); i++)
            this.mobList.push(EnemyModel(this.map.waypoints, mobColor));
    }

    update(deltaTime) {
        this.mobList.forEach(mob => mob.update(deltaTime));
        this.towerList.forEach(tower => tower.update(deltaTime));
        if (this.waveIncoming) {
            this.generateWave();
            this.waveIncoming = false;
        }
        if (this.mobList.length == 0) {
            this.waveIncoming = true;
            this.wavesSurvived++;
        }

    }
}

class TowerView {
    constructor(mapX, mapY, colorId) {
        this.self = document.createElement('div');
        this.inner = document.createElement('div');
        this.self.className = 'tower';
        this.inner.className = 'towerInner';
        this.self.style.clipPath = tierClipPath[1];
        this.inner.style.clipPath = tierClipPath[1];
        this.inner.style.backgroundColor = colors[colorId];
        document.getElementById(`tile_${mapX}_${mapY}`).appendChild(this.self);
        this.self.appendChild(this.inner);
    }

    setTier(tier) {
        let truncatedTier = Math.trunc(tier);
        this.self.style.clipPath = tierClipPath[truncatedTier];
        this.inner.style.clipPath = tierClipPath[truncatedTier];
    }
}

class EnemyView {
    constructor() {

    }
}

class GameView {
    constructor() {
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
    }

    update(deltaTime) {
    }
}

const emptyTile = 'e';
const roadTile = 'r';
const towerTile = 't';
const spawnTile = 's';
const baseTile = 'b';

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
    waypoints: {

    }
}