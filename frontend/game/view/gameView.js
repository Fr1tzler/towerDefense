import * as Configs from "../configs.js"
import { towerTierPath, enemyTierPath } from "./geometry.js"

export class GameView {
  constructor(modelInfo) {
    this.origin = modelInfo
    // this.tower1 = new Image()
    // this.tower1.src = "images/sprites/tower-1.png"
    // this.laser = new Image()
    // this.laser.src = "images/sprites/laser.png"
    let tileScreen = document.getElementById("tileScreen")
    tileScreen.innerHTML =
      '<canvas class="laserRayLayer" id="laserRayLayer" height="800" width="800" ></canvas>' // FIXME: поправить, когда будет время
    for (let tileY = 0; tileY < 10; tileY++) {
      let row = document.createElement("div")
      row.className = "tileRow"
      tileScreen.appendChild(row)
      for (let tileX = 0; tileX < 10; tileX++) {
        let tile = document.createElement("div")
        tile.className = "tile "
        tile.className +=
          this.tileToClassDictionary[modelInfo.mapData.map[tileY][tileX]]
        tile.id = `tile_${tileX}_${tileY}`
        row.appendChild(tile)
      }
    }

    let canvas = document.getElementById("laserRayLayer")

    this.context = canvas.getContext("2d")
    this.context.lineWidth = 3

    // adding baseHp progressbar on field
    this.baseLocation = modelInfo.calculateBaseLocation()
    let baseTile = document.getElementById(
      `tile_${this.baseLocation[0]}_${this.baseLocation[1]}`
    )
    this.progressBarRadius = Math.trunc(
      (baseTile.scrollHeight * Configs.mapSizePx) / 1000 / 2
    )
    this.mergeButton = document.getElementById("mergeButtonLabel")
  }

  update() {
    this.context.clearRect(0, 0, Configs.mapSizePx, Configs.mapSizePx)

    // drawing towers
    this.origin.towerMap.forEach((tower, coords, map) => {
      this.drawTowerOnCanvas(tower)
    })

    // drawing laser rays
    this.origin.laserRayList.forEach((currentRay) => {
      let lineFrom = this.transformModelToCanvasCoords(currentRay.from, true)
      let lineTo = this.transformModelToCanvasCoords(currentRay.to, false)
      this.context.strokeStyle = Configs.colors[currentRay.colorId]
      this.context.beginPath()
      this.context.moveTo(lineFrom.X, lineFrom.Y)
      this.context.lineTo(lineTo.X, lineTo.Y)
      this.context.closePath()
      this.context.stroke()
    })
    // drawing enemies
    this.origin.activeEnemyList.forEach((enemy) => {
      this.drawEnemyOnCanvas(enemy)
    })
    // other view changes
    document.getElementById(
      "currentWaveValue"
    ).innerText = `Волна ${this.origin.currentWave}`
    document.getElementById(
      "currentMoneyValue"
    ).innerText = `${this.origin.earnedMoney} гривень`
    this.drawBaseHP()
    this.drawTowersInInfoPanel()
    this.mergeButton.innerText = `Merge! (${this.origin.mergeCost} гривень)`
  }

  transformModelToCanvasCoords(coords) {
    return { X: coords.X * 0.8, Y: coords.Y * 0.8 }
  }

  drawTowerOnCanvas(tower) {
    let towerLevel = Math.min(Math.trunc(tower.level), 8)
    let pathBeginPoint = this.transformModelToCanvasCoords(tower.position)
    let pathCoords = this.transformPath(
      towerTierPath[towerLevel],
      (tower.currentRotation * Math.PI) / 180,
      0.7
    )
    // this.context.drawImage(
    //   this.tower1,
    //   pathBeginPoint.X - 25,
    //   pathBeginPoint.Y - 25,
    //   50,
    //   50
    // )

    this.context.beginPath()
    this.context.fillStyle = Configs.colors[tower.colorId]
    this.context.moveTo(
      pathBeginPoint.X + pathCoords[0][0],
      pathBeginPoint.Y + pathCoords[0][1]
    )
    for (let i = 0; i < pathCoords.length; i++) {
      this.context.lineTo(
        pathBeginPoint.X + pathCoords[i][0],
        pathBeginPoint.Y + pathCoords[i][1]
      )
    }
    this.context.closePath()
    this.context.strokeStyle = "#000"
    this.context.fill()
    this.context.stroke()
  }

  drawEnemyOnCanvas(enemy) {
    let pathBeginPoint = this.transformModelToCanvasCoords(enemy.position)
    this.context.beginPath()
    this.context.moveTo(pathBeginPoint.X - 20, pathBeginPoint.Y - 40)
    let hpCoefficient = enemy.healthPoints / enemy.maxHP
    let deltaX = Math.trunc(40 * hpCoefficient) - 20
    this.context.lineTo(pathBeginPoint.X + deltaX, pathBeginPoint.Y - 40)
    this.context.closePath()
    this.context.strokeStyle = `rgb(${Math.trunc(
      255 * (1 - hpCoefficient)
    )}, ${Math.trunc(255 * hpCoefficient)}, 0)`
    this.context.closePath()
    this.context.stroke()

    let pathCoords = this.transformPath(
      enemyTierPath[enemy.level],
      (enemy.currentRotation * Math.PI) / 180,
      0.5
    )
    this.context.beginPath()
    this.context.fillStyle = Configs.colors[enemy.colorId]
    this.context.moveTo(
      pathBeginPoint.X + pathCoords[0][0],
      pathBeginPoint.Y + pathCoords[0][1]
    )
    for (let i = 0; i < pathCoords.length; i++) {
      this.context.lineTo(
        pathBeginPoint.X + pathCoords[i][0],
        pathBeginPoint.Y + pathCoords[i][1]
      )
    }
    this.context.closePath()
    this.context.strokeStyle = "#000"
    this.context.fill()
    this.context.stroke()
  }

  drawBaseHP() {
    let calculatedLocation = {
      X: (this.baseLocation[0] + 0.5) * 80,
      Y: (this.baseLocation[1] + 0.5) * 80,
    }
    this.context.beginPath()
    this.context.fillStyle = "white"
    this.context.strokeStyle = "white"
    this.context.lineWidth = 5
    this.context.arc(
      calculatedLocation.X,
      calculatedLocation.Y,
      this.progressBarRadius,
      -Math.PI / 2,
      -Math.PI / 2 - (2 * Math.PI * this.origin.baseHp) / 100,
      true
    )
    this.context.font = "20pt Gardens CM"
    let text = `${this.origin.baseHp}`
    let smallShift = text.length == 2 ? 5 : 0
    this.context.fillText(
      text,
      calculatedLocation.X - 20 + smallShift,
      calculatedLocation.Y + 8
    )
    this.context.stroke()
    this.context.lineWidth = 3
    this.context.strokeStyle = "black"
  }

  transformPath(towerPath, angle, multiplier) {
    let result = []
    for (let i = 0; i < towerPath.length; i++) {
      result.push([])
      let x = (towerPath[i][0] - 50) * multiplier
      let y = (towerPath[i][1] - 50) * multiplier
      result[i].push(x * Math.cos(angle) - y * Math.sin(angle))
      result[i].push(x * Math.sin(angle) + y * Math.cos(angle))
    }
    return result
  }

  drawTowersInInfoPanel() {
    if (this.origin.selectedTowers.length == 0) return
    if (this.origin.selectedTowers.length == 1) {
      let coords = this.origin.selectedTowers[0]
      let tower = this.origin.towerMap.get(coords[0] * 10 + coords[1])
      this.drawTowerInInfoPanelCanvas(tower, 1)
      return
    }
    let coords1 = this.origin.selectedTowers[0]
    let coords2 = this.origin.selectedTowers[1]
    let tower1 = this.origin.towerMap.get(coords1[0] * 10 + coords1[1])
    let tower2 = this.origin.towerMap.get(coords2[0] * 10 + coords2[1])
    this.drawTowerInInfoPanelCanvas(tower1, 1)
    this.drawTowerInInfoPanelCanvas(tower2, 2)
    this.drawTowerInInfoPanelCanvas(this.origin.towerOnMerge, 3)
  }

  drawTowerInInfoPanelCanvas(tower, frameId) {
    let canvas = document.getElementById(`towerInfoImage${frameId}`)
    let context = canvas.getContext("2d")
    let level = Math.trunc(tower.level)
    let rawPath = towerTierPath[Math.min(level, 8)]
    let towerPath = this.transformPath(
      rawPath,
      (tower.currentRotation * Math.PI) / 180,
      1.6
    )
    context.clearRect(0, 0, 200, 200)
    // context.drawImage(
    //   this.tower1,
    //   100 + towerPath[0][0] - 75,
    //   100 + towerPath[0][1] - 15
    // )
    context.lineWidth = 5
    context.beginPath()
    context.fillStyle = Configs.colors[tower.colorId]
    context.moveTo(100 + towerPath[0][0], 100 + towerPath[0][1])
    for (let i = 0; i < towerPath.length; i++) {
      context.lineTo(100 + towerPath[i][0], 100 + towerPath[i][1])
    }
    context.closePath()
    context.strokeStyle = "#000"
    context.fill()
    context.stroke()

    let towerDataContainer = document.getElementById(`towerInfoData${frameId}`)
    let towerData = {
      level: Math.trunc(tower.level * 10) / 10,
      damage: Math.trunc(tower.calculateRawDamage()),
    }
    towerDataContainer.innerHTML = `Level: ${towerData.level}<br>Damage: ${towerData.damage}`
  }

  tileToClassDictionary = {
    e: "emptyTile",
    rv: "roadVertical",
    rh: "roadHorizontal",
    rlt: "roadLeftTop",
    rld: "roadLeftDown",
    rrt: "roadRightTop",
    rrd: "roadRightDown",
    t: "towerTile",
    s: "spawnTile",
    b: "baseTile",
    p: "pit",
    xs: "xStone",
    fs: "fStone",
    us: "uStone",
    ms: "mStone",
    br: "branches",
    tr: "tree",
    st: "stone",
    bh: "bigHouse",
    mh: "miniHouse",
  }
}
