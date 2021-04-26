const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 80;

// FIXME: deprecated? I DUNNO LOL
app.use(express.static(path.join(__dirname, 'frontend')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (request, response) => {
    response.sendFile(`${__dirname}/frontend/index.html`);
});

app.get('/get_map', (request, response) => {
    let mapPage = request.query.mapPage;
    // TODO: make request to database, extract maps with pageId == mapPage
    response.send({ 'do you want data' : 'i will not give it' });
});


app.post('/handle', (request, response) => {
    let username = request.body.username;
    let score = request.body.score;
    let mapId = request.body.mapId;
    let timePlayed = request.body.timePlayed;
    // TODO: Make one more request to database
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