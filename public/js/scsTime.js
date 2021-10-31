
var SCS_UTC_HOUR = 19; 

function updateScsTime(){
    var today = new Date();
    // var today = new Date('2021-04-28T12:00:00');

    utc_h = today.getUTCHours();
    utc_m = today.getUTCMinutes();
    utc_s = today.getUTCSeconds();

    next_scs = SCS_UTC_HOUR - utc_h;
    prev_scs = (SCS_UTC_HOUR - 24) - utc_h;
    if (next_scs <= 0) next_scs += 24;
    if (next_scs == 0) prev_scs = 0;
    if (prev_scs <= -24) prev_scs += 24;
    if (prev_scs == 0) prev_scs = -0;

    scs_h = next_scs < 12 ? -next_scs : -prev_scs;
    scs_m = utc_m;
    scs_s = utc_s;
    
    if (scs_h < 0){
        scs_h += 1;

        scs_s = 60 - scs_s;
        scs_m = 59 - scs_m;
        if (scs_s >= 60){
            scs_m += 1;
            scs_s = 0;
        }
        if (scs_m >= 60){
            scs_h -=1;
            scs_m = 0;
        }
        if (scs_h == 0) scs_h = -0;
    }

    $("#scsTime").text(`SCS${formatTimeNumber(scs_h, true)}:${formatTimeNumber(scs_m)}:${formatTimeNumber(scs_s)}`);

    setTimeout(updateScsTime, 1000);
}

function formatTimeNumber(i, sign=false) {
    out = Math.abs(i);
    if (out < 10) {out = "0" + out};  // add zero in front of numbers < 10
    if (sign) out = (1/i > 0 ? '+' : '-') + out;
    return out;
  }