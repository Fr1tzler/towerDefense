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
    let tileScreen = document.getElementById('tileScreen');
    for (let i = 0; i < 10; i++) {
        let row = document.createElement('div');
        row.className = 'tileRow';
        tileScreen.appendChild(row);
        for (let j = 0; j < 10; j++) {
            let tile = document.createElement('div');
            tile.className = 'tile';
            row.appendChild(tile);
        }
    }
    //screenChangingLoop();
    console.log(document.cookie);
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
    document.cookie=`username=${username}; SameSite=LAX`;
    console.log(document.cookie);
}

function getCookie(cookieName) {    
    cookieName += "=";    
    let cookieArray = document.cookie.split(';');    
    for (let cookieId = 0; cookieId < cookieArray.length; cookieId++) {        
        var cookie = cookieArray[cookieId];        
        while (cookie.charAt(0)==' ') cookie = cookie.substring(1,cookie.length);        
        if (cookie.indexOf(cookieName) == 0) return cookie.substring(cookieName.length, cookie.length);    
    }    
    return null;
}

function requestMapPage() {
    fetch(`/get_maps?mapPage=${mapPage}`, {})
    .then(response => {return response.json();})
    .then(result => {drawMaps(result);})
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
    .then(response => {return response.json();})
    .then(result => {updateLeaderbords(result);})
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
            X : mapX * tileLengthMultipier,
            Y : mapY * tileLengthMultipier
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
    constructor() {
        this.position = {
            X: 0,
            Y: 0
        }
        this.healthPoints = 100;
        this.color = getRandomInt(0, colors.length);
        this.isAlive = true;
        this.targetPosition = {
            X: 1000,
            Y: 1000
        }
        this.speed = 10;
    }

    receiveDamage(incomingDamage) {
        this.healthPoints = Math.max(0, this.healthPoints - incomingDamage);
        if (this.healthPoints == 0) 
            this.isAlive = false;
    }

    moveToTarget(deltaTime) {
        let deltaPosition = {
            X: this.targetPosition.X - this.position.X,
            Y: this.targetPosition.Y - this.position.Y,
        }
        let deltaDistance = Math.hypot(deltaPosition.X, deltaPosition.Y);
        let distanceRatio = Math.min(1, deltaTime * this.speed / deltaDistance);
        this.position.X += deltaPosition.X * distanceRatio;
        this.position.Y += deltaPosition.Y * distanceRatio;
    }
}

// TODO:
class GameModel {
    constructor() {
    }

    update(deptaTime) {
    }
}

class GameView {
    constructor() {
    }

    update(deltaTime) {
    }
}