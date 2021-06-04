const express = require("express");
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');
// const MongoClient = require('mongodb').MongoClient;

const privateKey = fs.readFileSync('/etc/letsencrypt/live/fritzler.ru/privkey.pem');
const certificate = fs.readFileSync('/etc/letsencrypt/live/fritzler.ru/fullchain.pem');
const credentials = {key: privateKey, cert: certificate};

const app = express();
const dbPort = 0;

app.use(express.static(path.join(__dirname, 'frontend')));
app.use(express.urlencoded({ extended: false}));
app.use(express.json());

app.get('/', (request, response) => {
    response.sendFile(`${__dirname}/frontend/index.html`);
});

// TODO: make request to database, extract maps with pageId == mapPage
app.get('/get_maps', (request, response) => {
    let mapPage = request.query.mapPage;
    response.send({ 'do you want data' : 'i will not give it' });
});

// TODO: Make one more request to database
app.post('/send_game_stats', (request, response) => {
    let username = request.body.username;
    let score = request.body.score;
    let mapId = request.body.mapId;
    response.send({
        '1' : 'Lupa',
        '2' : 'Lupa',
        '3' : 'Lupa',
        '4' : 'Lupa',
        '5' : 'Lupa',
        '6' : 'Lupa',
        '7' : 'Lupa',
        '8' : 'Lupa',
        '9' : 'Lupa',
        '10e6' : username
    });
});

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80);
httpsServer.listen(443);


/*
проверить и убрать в случае чего 
app.listen(serverPort, () => {
    console.log(`Server listening at http://localhost:${serverPort}`)
});*/

/*
// TODO:
const mongoClient = new MongoClient(`mongodb://localhost:${dbPort}/`, { useUnifiedTopology: true });
mongoClient.connect(function(err, client){
 
    if(err){
        return console.log(err);
    }

    client.close();
});*/