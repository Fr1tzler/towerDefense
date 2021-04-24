const http = require('http');
const url = require('url');

http.createServer((request, response) => {
    if (request.method == "GET") {
        console.log('GET');
        let urlRequest = url.parse(request.url, true);
        if (urlRequest.query.mapPage) {
            response.write(JSON.stringify(getMapList(urlRequest.query.mapPage)))
        } else {
            // send index.html and other files to user
        }
    } else if (request.method == "POST") {
        console.log('POST');
        // there we will send user game statistics to database
    } else {
        console.log("other");
    }
    response.end();
}).listen(8000);

// Gets pageId and returns list of objects(maps) from db
function getMapList(pageId) {
    return [tempMap, tempMap, tempMap, tempMap];
}

// 0 - emptyTile, 1 - towerPlatformTile, 2 - roadTile, 3 - spawnTile, 4 - baseTile
const tempMap = {
    dimensionalArray: [
        [0, 0, 3, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 2, 1, 1, 1, 1, 1, 0, 0],
        [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
        [0, 1, 1, 1, 0, 0, 1, 2, 1, 0],
        [0, 0, 0, 0, 0, 0, 1, 2, 1, 0],
        [0, 0, 0, 0, 1, 1, 1, 2, 0, 0],
        [0, 0, 1, 2, 2, 2, 2, 2, 1, 0],
        [0, 0, 1, 2, 1, 1, 0, 1, 1, 0],
        [0, 0, 1, 2, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 4, 0, 0, 0, 0, 0, 0],
    ],
    enemyWaypoints: [
        [0, 2],
        [2, 2],
        [2, 7],
        [6, 7],
        [6, 3],
        [9, 3],
    ],
};