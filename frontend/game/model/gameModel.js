import * as Configs from '../configs.js';
import { getRandomInt, countNextLevel, countColorOnAbsorb, countDamageMultiplier, calculateSegmentAngle } from './mathModule.js';

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
        this.rotationSpeed = 5; // DEGREES / TICK
        this.confidenceRange = 5; // DEGREES, TOWER WILL SHOOT AT ENEMY IF IT IS WHITHIN THIS RANGE IN DEGREES
        this.currentTarget = null; // ENEMY MODEL
        this.colorId = getRandomInt(0, Configs.colors.length);
    }

    calculateRawDamage() {
        return this.level * 15;
    }

    update(laserRayList) {
        if (this.currentTarget == undefined)
            return;
        let deltaRotation = this.targetRotation - this.currentRotation;
        if (Math.abs(deltaRotation) > 180)
            deltaRotation -= Math.sign(deltaRotation) * 360;
        this.currentRotation += Math.sign(deltaRotation) * Math.min(this.rotationSpeed, Math.abs(deltaRotation));
        this.currentRotation %= 360;
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
        this.maxHP = 500 * level;
        this.healthPoints = 500 * level;
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
        this.speed = 5; // CONVENTIONAL UNITS / TICK
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

    update() {
        if (this.reachedBase) return;
        let deltaPosition = {
            X: this.targetPosition.X - this.position.X,
            Y: this.targetPosition.Y - this.position.Y,
        }

        if (deltaPosition.Y == 0) {
            if (deltaPosition.X > 0) {
                this.position.X = Math.min(this.position.X + this.speed, this.targetPosition.X);
                this.currentRotation = 90;
            } else {
                this.position.X = Math.max(this.position.X - this.speed, this.targetPosition.X);
                this.currentRotation = 270;
            }
        } else {
            if (deltaPosition.Y > 0) {
                this.position.Y = Math.min(this.position.Y + this.speed, this.targetPosition.Y);
                this.currentRotation = 180;
            } else {
                this.position.Y = Math.max(this.position.Y - this.speed, this.targetPosition.Y);
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

export class GameModel {
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

    update() {
        this.laserRayList = [];
        this.activeEnemyList.forEach(enemy => enemy.update());
        this.towerMap.forEach((tower, _, __) => tower.selectEnemy(this.activeEnemyList));
        this.towerMap.forEach((tower, _, __) => tower.update(this.laserRayList));

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