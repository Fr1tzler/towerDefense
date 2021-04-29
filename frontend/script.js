let mapPage = 0;
let username = 'username';
let score = 0;
let mapId = 0;

const gameStages = [
    'pregame',
    'game',
    'aftergame'
]
let currentGameStage = 0;

document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log('Иди своей дорогой, сталкер.');
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
    screenChangingLoop();
}

function screenChangingLoop() {
    document.getElementById(gameStages[currentGameStage]).style.opacity = "0";
    document.getElementById(gameStages[currentGameStage]).style.visibility = "hidden";
    currentGameStage = (currentGameStage + 1) % 3;
    document.getElementById(gameStages[currentGameStage]).style.opacity = "1";
    document.getElementById(gameStages[currentGameStage]).style.visibility = "visible";
    setTimeout(screenChangingLoop, 5000);
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

function countNextLevel(absorberTowerLevel, eatedTowerLevell) {
    return absorberTowerLevel + eatedTowerLevell / absorberTowerLevel;
}

// TODO:
function countColorOnAbsorb(absorberColorId, eatedColorId) {
    return 0;
}

// TODO:
function countDamageMultiplier(towerColorId, enemyColorId) {
    return 0;
}

// TODO: Добавить способ вытаскивать юзернейм при обновлении текстового поля (легчайше, но потом) 
function saveUsernameInCookies() {
    document.cookie=`username=${username}`;
}

function getUsernameInCookies() {
    document.cookie.split(';').forEach(cooka => {
        let match = cooka.match(/username=(.+)/);
        if (match.length != 0)
            return match[1]
    })
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