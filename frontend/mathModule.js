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

export function countDamageMultiplier(towerColorId, enemyColorId, colorCount) {
    let colorIdDelta = Math.abs(enemyColorId - towerColorId);
    if (colorIdDelta > colorCount / 2)
        colorIdDelta = colorCount - colorIdDelta;
    return (colorCount - colorIdDelta * 2) / colorCount;
}

export function calculateSegmentAngle(dx, dy) {
    return 180 - Math.trunc(Math.atan2(dx, dy) * 180 / Math.PI);
}