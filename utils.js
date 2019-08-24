
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
}

function precise(x, digits){
    // return Number.parseFloat(x).toPrecision(digits);
    return parseFloat(Number.parseFloat(x).toPrecision(digits));
}

function getDamageMod(damageType, target){
    return damage_dataset.getCellByString(damageType, "Name", target)
}


function getProjectileArc(speed, angle, start_height, drop, start, end, steps){
    // Return list of points containing the projectile arc.
    let points = [];
    for (let i=0; i<steps; i++){
        let t = start + (end - start) * i / steps;
        points.push(projectilePos(t, speed, angle, drop, start_height));
    }
    return points;
}

function searchAngle(speed, drop, start_height, target_point){
    // Return angle required to hit point.
    let y;
    let angle = - Math.PI / 2;
    let angle_step = Math.PI / 50;
    let max_loops = Math.PI / angle_step;
    let loops = 0;

    // First find out if target is reachable, and figure out rough angle
    do{
        if (loops > max_loops){
            console.log("hit not found");
            break;
        }
        loops++;
        
        let t = tAtHit(speed, angle, target_point[0]);
        y = projectilePos(t, speed, angle, drop, start_height)[1];
        angle += angle_step;
        // console.log("Testing angle: ", precise(angle/Math.PI,3), " : ", precise(y, 3), " : ", precise(target_point[1], 3))
        
    }while(y < target_point[1]);
    angle -= angle_step;

    // Search for correct angle
    let a1 = angle;
    let a2 = angle - angle_step;
    let a3 = (a1 + a2) / 2;

    for (i=0; i<5; i++){
        let a3 = (a1 + a2) / 2;
        let t1 = tAtHit(speed, a1, target_point[0]);
        let t2 = tAtHit(speed, a2, target_point[0]);
        let t3 = tAtHit(speed, a3, target_point[0]);


        let d1 = projectilePos(t1, speed, a1, drop, start_height)[1] - target_point[1];
        let d2 = projectilePos(t2, speed, a2, drop, start_height)[1] - target_point[1];
        let d3 = projectilePos(t3, speed, a3, drop, start_height)[1] - target_point[1];

        if (d3 > 0 && d3 < d1) a1 = a3;
        else if (d3 < 0 && d3 > d2) a2 = a3;
        else{
            console.log("Middle angle worst");
            break;
        }
    }

    let t = tAtHit(speed, a1, target_point[0]);
    y = projectilePos(t, speed, a1, drop, start_height)[1];

    // console.log("Angle refined: ", a1, " : ", y, " : ", precise(target_point[1], 3));
    return getProjectileArc(speed, a1, start_height, drop, 0, tAtHit(speed, a1, target_point[0]), 100);


}

// trigonometry yo

function projectilePos(t, speed, angle, drop, start_height){
    // Return projectile position after t seconds
    return [speed * Math.cos(angle) * t,
            speed * Math.sin(angle) * t - drop/2 * Math.pow(t, 2) + start_height];
}

function tAtHit(speed, angle, target_x){
    // Return time that projectile reaches target
    return target_x/(speed * Math.cos(angle));
}