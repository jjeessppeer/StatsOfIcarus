



const tagFuncs = {
    'SCS': isSCS,
    'Competitive': isComp,
    'Passworded': (match) => { return match.Passworded == true; },
    'ShipsFull': (match) => { return match.ShipsFull == true; },
    'PlayersFull': (match) => { return match.PlayersFull == true; },
}

function isComp(match) {

}

function isSCS(match) {
    if(!match.Passworded) return false;
    if(!match.PlayersFull) return false;

    const SCS_HOUR = 20;
    const SCS_LENGTH = 3;
    const SCS_DAY = 0;
    const date = new Date(match.Timestamp);

    if(date.getDay() != SCS_DAY) return false;

    return dayTimeBetween(date, SCS_HOUR, 5, SCS_HOUR + SCS_LENGTH);
}


function dayTimeBetween(date, minHours, minMinutes, maxHours) {
    const hour = date.getHours();
    const minutes = date.getMinutes();

    if (hour < minHours) return false;
    if (hour > maxHours) return false;
    if (hour == minHours && minutes < minMinutes) return false;

    return true;
}

function getTags(match) {

}


module.exports = { 
    getTags,
    isSCS 
};