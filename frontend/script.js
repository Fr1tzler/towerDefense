import { Game } from './game/gameMain.js';

let mapList;

let mapPage = 1;
let username = 'Anonymous';
let score = 0;
let mapId = 1;

let currentGameStage = 0;
let lastKnownGameStage = 0;

let game = undefined;

const fps = 50;

let selectedMap = 0;

document.addEventListener('DOMContentLoaded', init);

function init() {
    let savedUsername = getLocalStorageData('username');
    if (savedUsername) {
        document.getElementById('usernameField').value = savedUsername;
        username = savedUsername;
    }
    document.getElementById('confirmUsername').addEventListener('click', saveUsername);

    for (let i = 0; i < 9; i++) { 
        document.getElementById(`preview_${i + 1}`).addEventListener('click', function() {
            for (let j = 0; j < 9; j++) {
                document.getElementById(`preview_${i + 1}`).style.backgroundColor = '#999';
            }
            document.getElementById(`preview_${i + 1}`).style.backgroundColor = '#CCC';
            selectedMap = i;
            console.log(i);
        })
    }

    requestMapPage();

    document.getElementById('startNewGame').addEventListener('click',  () => { currentGameStage = 1; });
    document.getElementById('gotoNewGameScreen').addEventListener('click', () => { currentGameStage = 0; })

    resizeEverything();
    mainloop();
}

function mainloop() {
    if (currentGameStage == lastKnownGameStage) {
        if (currentGameStage == 1) {
            game.update()
            if (game.gameEnded) {
                score = game.score;
                game = undefined;
                requestGameStats();
                currentGameStage = 2;
            }
        }
    } else {
        lastKnownGameStage = currentGameStage;
        switch (currentGameStage) {
            case 0:
                makeScreenVisible('pregame');
                break;
            case 1:
                makeScreenVisible('game');
                game = new Game(mapList[selectedMap]);
                game.update();
                break;
            case 2:
                makeScreenVisible('aftergame');
                break;
            default:
                break;
        }
    }
    setTimeout(mainloop, 1000 / fps);
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

function saveUsername() {
    username = document.getElementById('usernameField').value;
    localStorage.setItem('username', username);
}

function getLocalStorageData(key) {
    return localStorage.getItem(key);
}

function requestMapPage() {
    fetch(`/get_maps?mapPage=${mapPage}`, {})
        .then(response => { return response.json(); })
        .then(result => { 
            mapList = result;
            drawMaps(result); 
        })
}

function requestGameStats() {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    
    // Почти всё, что дальше в этой функции, сгенерировано POSTMAN-ом, ибо у него запросы отчего-то работают, а у меня, отчего-то нет. И времени тоже нет. 
    let urlencoded = new URLSearchParams();
    urlencoded.append("username", username);
    urlencoded.append("score", score);
    urlencoded.append("mapId", mapId);
    
    let requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };
    
    fetch("/send_game_stats", requestOptions)
      .then(response => response.json())
      .then(result => updateLeaderbords(result))
      .catch(error => console.log('error', error));
}

function updateLeaderbords(leaderboards) {
    let table = document.getElementById("leadersTable");
    table.innerHTML = "";
    let topRow = document.createElement("tr");
    topRow.innerHTML = '<td class="leaderName">Player</td><td class="leaderScore">Score</td>';
    table.appendChild(topRow);
    for (let i = 0; i < leaderboards.length; i++) {
        let row = document.createElement("tr");
        row.innerHTML = `<td class="leaderName">${leaderboards[i][0]}</td><td class="leaderScore">${leaderboards[i][1]}</td>`;
        table.appendChild(row);
    }
}

// TODO: убрать в отдельный, более подходящий файл, ибо это немного view
function drawMaps(mapList) {
    const tileToColorDict = {
        'e' : '#444',
        't' : '#888',
        'r' : '#666',
        's' : '#F00',
        'b' : '#0F0'
    }
    for (mapId = 0; mapId < 9; mapId++) {
        let currentMap = mapList[mapId];
        let canvas = document.getElementById(`mapImage${mapId + 1}`);
        let context = canvas.getContext('2d');
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 10; x++) {
                context.fillStyle = tileToColorDict[currentMap.map[y][x]];
                context.fillRect(x * 10, y * 10, x * 10 + 10, y * 10 + 10);
            }
        }
    }
}

// CSS media-запросы, это, конечно, хорошо, но разбираться, увы, уже времени нет.
function resizeEverything() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    while (height > width) {
        alert('Ориентируйте экран альбомно!')
    }
    let basicSquareSize = Math.trunc(Math.min(width / 16, height / 9) * 0.9);
    
    document.getElementById('preGameScreen').style.width = basicSquareSize + 'px';
    document.getElementById('preGameScreen').style.height = basicSquareSize + 'px';
    
    document.getElementById('sidePanelLeft').style.width = Math.trunc(basicSquareSize / 4) + 'px';
    document.getElementById('sidePanelLeft').style.height = basicSquareSize + 'px';

    document.getElementById('tileScreen').style.width = basicSquareSize + 'px';
    document.getElementById('tileScreen').style.height = basicSquareSize + 'px';
    
    document.getElementById('aftergame').style.width = basicSquareSize + 'px';
    document.getElementById('aftergame').style.height = basicSquareSize + 'px';
}

window.addEventListener('resize', resizeEverything);