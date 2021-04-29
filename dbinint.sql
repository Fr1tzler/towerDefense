CREATE DATABASE towerDefense;
USE towerDefense;
CREATE TABLE userStatistics (
    gameId INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(30) NOT NULL,
    score INT NOT NULL,
    mapId INT NOT NULL
);
-- TODO: Добавить скрипт инициализирующий таблицу с картами.