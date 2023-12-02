var SCS_START_BELIN = "20:00:00";

function secondsBetween(timeStr1, timeStr2) {
    // Return the minimum difference in seconds between two clock strings, like 20:00:00 and 19:59:00
    const p1 = timeStr1.split(":").map(Number);
    const p2 = timeStr2.split(":").map(Number);
    let diff = ( p1[0] * 3600 + p1[1] * 60 + p1[2] ) - ( p2[0] * 3600 + p2[1] * 60 + p2[2] );
    if (diff < 0) diff += 86400;
    if (diff > 43200) diff -= 86400;
    return diff;
}

function updateScsTime(){
    let dateOptions = {
        timeZone: 'Europe/Berlin',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    }
    const formatter = new Intl.DateTimeFormat([], dateOptions);
    const berlin_time = formatter.format(new Date());
    let timeDiff = secondsBetween(berlin_time, "20:00:00");
    
    let sign = '+';
    if (timeDiff < 0) {
        sign = '-';
        timeDiff = -timeDiff;
    }
    const timeStr = new Date(timeDiff * 1000).toISOString().substring(11, 19);

    const el = document.getElementById('scsTime');
    el.textContent = `SCS${sign}${timeStr}`;
    // setTimeout(updateScsTime, 1000);
}
updateScsTime();
setInterval(updateScsTime, 1000)