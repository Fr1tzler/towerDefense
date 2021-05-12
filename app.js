const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
const port = 80;

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


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
});