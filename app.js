const express = require("express");
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
const mysql = require('mysql');

const privateKey = fs.readFileSync('/etc/letsencrypt/live/fritzler.ru/privkey.pem');
const certificate = fs.readFileSync('/etc/letsencrypt/live/fritzler.ru/fullchain.pem');
const credentials = {key: privateKey, cert: certificate};

const secrets = require('./secrets.json');
const connection = mysql.createConnection({
    host: secrets.dbHost,
    user: secrets.dbUsername,
    database: secrets.dbName,
    password: secrets.dbPassword
})

connection.connect(err => {
    if (err) {
        console.log(err);
        return err
    } else {
        console.log('Database connected successfully');
    }
})

const app = express();

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.urlencoded({ extended: false}));
app.use(express.json());

app.get('/', (request, response) => {
    response.sendFile(`${__dirname}/frontend/index.html`);
});

app.get('/get_maps', (request, response) => {
    let mapPage = request.query.mapPage;
    let responseData = [];
    for (let mapId = 1; mapId < 10; mapId++) {
        let mapInfo = require(`./maps/map_${mapPage}_${mapId}.json`)
        responseData.push(mapInfo);
    }
    response.send(JSON.stringify(responseData));
});

app.post('/send_game_stats', (request, response) => {
    let score = request.body.score;
    let mapId = request.body.mapId;
    let mapPage = request.body.mapPage;
    console.log(score + ' ' + mapId + ' ' + mapPage);
    connection.query(`INSERT INTO leaderboards(score, mapId, username) VALUES (:score, :mapId, :username)`, {
        score : request.body.score,
        mapId : request.body.mapId,
        username : request.body.username
    }, function(err) {
        if (err) {
            console.log(err);
        }    
    });

    responseData = [];
    connection.query(`SELECT * FROM leaderboards WHERE mapId = ? ORDER BY score DESC`, 
    [request.body.mapId], function(err, result) {
        console.log(result.length);
        for (let dataPacketId = 0; dataPacketId < Math.min(10, result.length); dataPacketId++) {
            responseData.push([username, score]);
        }
    });

    response.send(JSON.stringify(responseData));
});

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80);
httpsServer.listen(443);