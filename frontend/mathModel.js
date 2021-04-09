function getDamageMultiplier(towerColorId, enemyColorId) {
    let delta = Math.abs(towerColorId - enemyColorId);
    return delta < 6 ? 1 - 0.15 * delta : -0.8 + 0.15 * delta;
}

function getNextLevel(levelOne, levelTwo) {
    let maxLevel = Math.max(levelOne, levelTwo);
    let minLevel = Math.min(levelOne, levelTwo);
    return maxLevel + minLevel / maxLevel;
}

function getRandomInt(lowerBound, upperBound) {
    lowerBound = Math.ceil(lowerBound);
    upperBound = Math.floor(upperBound);
    return Math.floor(Math.random() * (upperBound - lowerBound)) + lowerBound;
}

// FIX
function getMergedColor(towerColorId, enemyColorId) {
    let delta = towerColorId - enemyColorId;
    if (Math.abs(delta) < 6) {
        return towerColorId + Math.trunc(delta / 2);
    }
    return 0;
}