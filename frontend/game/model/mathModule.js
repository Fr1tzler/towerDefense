export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

export function countNextLevel(absorberTowerLevel, eatedTowerLevel) {
    return absorberTowerLevel + eatedTowerLevel / absorberTowerLevel;
}

// TODO: нынешняя версия функции работает не так, как должна.
export function countColorOnAbsorb(absorberColorId, eatedColorId, colorCount) {
    let delta = absorberColorId - eatedColorId;
    if (Math.abs(delta) < colorCount / 2)
        return (Math.trunc((absorberColorId + eatedColorId) / 2));
    return Math.trunc((absorberColorId + eatedColorId + 6) % colorCount / 2);
}

export function countDamageMultiplier(towerColorId, enemyColorId, colorCount) {
    let colorIdDelta = Math.abs(enemyColorId - towerColorId);
    if (colorIdDelta > colorCount / 2)
        colorIdDelta = colorCount - colorIdDelta;
    let result = (colorCount - colorIdDelta * 2) / colorCount;
    return result;
}

export function calculateSegmentAngle(dx, dy) {
    return 180 - Math.trunc(Math.atan2(dx, dy) * 180 / Math.PI);
}

export function calculateTileToModellCoords(coords, tileLengthMultipier) {
    return {
        X: coords.X * tileLengthMultipier + tileLengthMultipier / 2,
        Y: coords.Y * tileLengthMultipier + tileLengthMultipier / 2
    }
}