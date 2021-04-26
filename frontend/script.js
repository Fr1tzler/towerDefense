document.addEventListener('DOMContentLoaded', init);

function init() {
    console.log("ди своей дорогой, сталкер.");
}


const colors = [
    "#FF3C00", // orangered
    "#F79A00", // orange
    "#F2C500", // orangeyellow
    "#F0FF00", // yellow
    "#BAFF00", // yellowgreen
    "#4CBE2C", // green
    "#2F77CF", // lightblue
    "#5700FF", // blue
    "#53009F", // violetblue
    "#9000AD", // violet
    "#A4003D", // cherry
    "#FF0000", // red
];

function countNextLevel(absorberTowerLevel, eatedTowerLevell) {
    return absorberTowerLevel + eatedTowerLevell / absorberTowerLevel;
}

// TODO:
function countColorOnAbsorb(absorberColorId, eatedColorId) {
    return 0;
}

// TODO:
function countDamageMultiplier(towerColorId, enemyColorId) {
    return 0;
}