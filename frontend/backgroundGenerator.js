let crossContainer = document.getElementById("visualCrossContainer");
for (let i = 0; i < 10; i++) {
    let crossLine = document.createElement('div');
    crossLine.className = 'visualCrossLine';
    crossContainer.appendChild(crossLine);
    for (let j = 0; j < 10; j++) {
        let cross = document.createElement('div');
        cross.className = 'visualCross';
        crossLine.appendChild(cross);
    }
}