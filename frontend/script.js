import { Game } from "./game/gameMain.js"

const tempMap = {
  map: [
    ["st", "st", "e", "p", "mh", "bh", "e", "tr", "tr", "e"],
    ["tr", "rld", "rh", "rlt", "tr", "e", "rld", "rh", "rlt", "e"],
    ["br", "rv", "t", "rv", "e", "e", "rv", "t", "rv", "fs"],
    ["e", "rv", "t", "rv", "e", "e", "rv", "t", "rv", "fs"],
    ["e", "rv", "t", "rv", "e", "us", "rv", "t", "rv", "p"],
    ["e", "rv", "t", "rv", "e", "e", "rv", "t", "rv", "xs"],
    ["fs", "rv", "t", "rv", "e", "e", "rv", "t", "rv", "e"],
    ["e", "rv", "t", "rv", "e", "ms", "rv", "t", "rv", "e"],
    ["mh", "rv", "t", "rrt", "rh", "rh", "rrd", "t", "rv", "br"],
    ["e", "b", "e", "e", "e", "e", "e", "e", "s", "tr"],
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
  ],
}

let mapPage = 0
let username = "username"
let score = 0
let mapId = 0
let pageFocused = true

let currentGameStage = 0
let lastKnownGameStage = 0

let game = undefined
let selectedMap = tempMap

const fps = 50

document.addEventListener("DOMContentLoaded", init)

function init() {
  let usernameCookie = getCookie("username")
  if (usernameCookie)
    document.getElementById("usernameField").value = usernameCookie
  document
    .getElementById("confirmUsername")
    .addEventListener("click", saveUsernameInCookies)

  document.addEventListener("focus", () => {
    pageFocused = true
  })
  document.addEventListener("blur", () => {
    pageFocused = false
  })

  document.getElementById("startNewGame").addEventListener("click", () => {
    currentGameStage = 1
  })
  document.getElementById("gotoNewGameScreen").addEventListener("click", () => {
    currentGameStage = 0
  })

  mainloop()
}

function mainloop() {
  if (currentGameStage == lastKnownGameStage) {
    if (currentGameStage == 1) {
      game.update()
      if (game.gameEnded) {
        game = undefined
        requestGameStats()
        currentGameStage = 2
      }
    }
  } else {
    lastKnownGameStage = currentGameStage
    switch (currentGameStage) {
      case 0:
        requestMapPage()
        makeScreenVisible("pregame")
        break
      case 1:
        makeScreenVisible("game")
        game = new Game(selectedMap)
        game.update()
        break
      case 2:
        makeScreenVisible("aftergame")
        break
      default:
        break
    }
  }
  setTimeout(mainloop, 1000 / fps)
}

function makeScreenVisible(screenId) {
  document.getElementById("pregame").style.display = "none"
  document.getElementById("game").style.display = "none"
  document.getElementById("aftergame").style.display = "none"

  document.getElementById("pregame").style.opacity = 0
  document.getElementById("game").style.opacity = 0
  document.getElementById("aftergame").style.opacity = 0

  document.getElementById(screenId).style.display = "block"
  document.getElementById(screenId).style.opacity = 1
}

function saveUsernameInCookies() {
  username = document.getElementById("usernameField").value || "Anonymous"
  document.cookie = `username=${username}; SameSite=LAX`
}

function getCookie(cookieName) {
  cookieName += "="
  let cookieArray = document.cookie.split(";")
  cookieArray.forEach((cookie) => {
    while (cookie.charAt(0) == " ") cookie = cookie.substring(1, cookie.length)
    if (cookie.indexOf(cookieName) == 0)
      return cookie.substring(cookieName.length, cookie.length)
  })
  return null
}

function requestMapPage() {
  fetch(`/get_maps?mapPage=${mapPage}`, {})
    .then((response) => {
      return response.json()
    })
    .then((result) => {
      drawMaps(result)
    })
}

function requestGameStats() {
  let requestData = {
    username: username,
    score: score,
    mapId: mapId,
  }
  fetch("/send_game_stats", {
    method: "POST",
    body: JSON.stringify(requestData),
  })
    .then((response) => {
      return response.json()
    })
    .then((result) => {
      updateLeaderbords(result)
    })
}

// TODO:
function updateLeaderbords(leaders) {
  console.log(leaders)
}

//TODO: отрисовка страницы с картами на стартовом экране
function drawMaps(mapList) {
  console.log(mapList)
}
