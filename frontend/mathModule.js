export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

export function countNextLevel(absorberTowerLevel, eatedTowerLevel) {
    return absorberTowerLevel + eatedTowerLevel / absorberTowerLevel;
}

// TODO:
export function countColorOnAbsorb(absorberColorId, eatedColorId, colorCount) {
    return 1;
}

// TODO:
export function countDamageMultiplier(towerColorId, enemyColorId, colorCount) {
    return 0.0001;
}