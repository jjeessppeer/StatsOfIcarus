
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

function parseDate(text){
    if (text.length == 8){
        let year = parseInt(text.substring(0, 4))
        let month = parseInt(text.substring(4, 6))
        let day = parseInt(text.substring(6, 8))
        return new Date(year, month, day);
    }
    else if(text.length == 6){
        let year = parseInt("20" + text.substring(0, 2))
        let month = parseInt(text.substring(2, 4))
        let day = parseInt(text.substring(4, 6))
        return new Date(year, month, day);
    }
    return new Date();
}