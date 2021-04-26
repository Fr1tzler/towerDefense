const express = require("express");
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'frontend')));

app.get('/', (request, response) => {
    response.sendFile(`${__dirname}/frontend/index.html`);
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
});

// TODO:
// 1) Подключить БД и настроить работу с запросами к базе
//      a) Получать GET запросы и возвращать карты. 
//      b) Получать POST запросы (в них - статы игры) и возвращать позицию игрока в лидерборде