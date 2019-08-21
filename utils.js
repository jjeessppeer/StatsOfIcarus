
function textToXYCoords(text_coords){
    //Convert coordinates on form A1 into [x, y]. Example B2 -> [1, 1]
    let [x, y] = text_coords.match(/[a-z]+|[^a-z]+/gi);
    x = textToNumber(x);
    y -= 1;
    return [x, y];
}

function textToNumber(text){
    // Convert text into number A->0 B->1 AA->??
    return text.charCodeAt(0) - 65
}