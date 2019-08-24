
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
    if (text.length < 2) return false;
    if (text.substring(0, 2) == "20")
        text = text.substring(2, text.length);
    if (text.length < 4) return false;

    let year = parseInt("20" + text.substring(0, 2))
    let month = parseInt(text.substring(2, 4)) - 1;
    if(text.length == 6){
        let day = parseInt(text.substring(4, 6))
        return new Date(year, month, day);
    }
    return new Date(year, month);
    if(text)
    return false;
}

function precise(x, digits){
    // return Number.parseFloat(x).toPrecision(digits);
    return parseFloat(Number.parseFloat(x).toPrecision(digits));
}


function getDamageMod(damageType, target){
    return damage_dataset.getCellByString(damageType, "Name", target)
  }