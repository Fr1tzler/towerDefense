class Enemy { // пока не используется
    constructor() {
        this.colorId = getRandomInt(0, colors.length);
        this.health = 100 + Math.log(killedEnemies);
        this.block = document.createElement('div');
        this.block.backgroundColor = colors[this.colorId];
        this.speed = 10; // пусть будет 10, хз какая реальная величина в действительности
        this.tilePosition = tempMap.enemyWaypoints[0];
        this.windowPosition = transformTileToWindowCoords(this.tilePosition)
    }
}