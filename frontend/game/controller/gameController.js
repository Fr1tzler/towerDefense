import * as Configs from '../configs.js';

export class GameController {
    constructor(modelInfo) {
        this.origin = modelInfo;
        let tileMap = modelInfo.mapData.map;
        for (let y = 0; y < tileMap.length; y++)
            for (let x = 0; x < tileMap[y].length; x++)
                if (tileMap[y][x] == Configs.towerTile)
                    document.getElementById(`tile_${x}_${y}`).addEventListener('click', () => { this.selectTower(x, y) })
            
        document.getElementById('towerMergeButton').addEventListener('click', () => { this.origin.mergeTowers() });
    }

    selectTower(x, y) {
        let activeTowers = this.origin.selectedTowers;
        for (let i = 0; i < activeTowers.length; i++)
            if (activeTowers[i][0] == x && activeTowers[i][1] == y)
                return;
        if (activeTowers.length == 2) {
            document.getElementById(`tile_${activeTowers[0][0]}_${activeTowers[0][1]}`).style.backgroundColor = '#888';
            activeTowers.shift();
        }
        activeTowers.push([x, y]);
        document.getElementById(`tile_${x}_${y}`).style.backgroundColor = '#ccc';
    }
}