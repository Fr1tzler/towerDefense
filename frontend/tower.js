class Enemy {
    constructor(mapX, mapY) {
        this.position = {
            onTile : {
                X : mapX,
                Y : mapY
            },
            onMap : {
                X : mapX * 100,
                Y : mapY * 100
            }            
        }
        this.color = 0; // aboba
        this.level = 1;
        this.damage = 100;

    }
}