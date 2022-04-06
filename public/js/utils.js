var SHIP_LIST = [
    'Goldfish', 
    'Junker', 
    'Squid', 
    'Galleon',
    'Spire',
    'Pyramidion',
    'Mobula',
    'Magnate',
    'Crusader',
    'Judgement',
    'Corsair',
    'Shrike',
    'Stormbreaker'
]


function setUrlParam(param){
    let split_url = window.location.href.split("?");
    window.location.href = split_url[0] + "?" + param;
    // return split_url[0] + "?" + param;
}

function getUrlParam(url){
    let split_url = url.split("?");
    if (split_url.length > 0)
        return split_url[1];
    return false;
}

function getUrlParameterList(url){
    if (!url) url = window.location.hash;
    url = url.split("?");
    if (url.length <= 1) return false;
    let result = {};
    url[1].split("&").forEach((part) => {
        let item = part.split("=");
        result[item[0]] = item[1]
    });
    return result;

}

function getCookie(cookiename){
    var cookiestring=RegExp(""+cookiename+"[^;]+").exec(document.cookie);
    return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./,"") : "");
}

function setCookie(name, value){
    document.cookie = name + "=" + value;
}

function degToRad(deg){
    return deg * Math.PI / 180;
}

function radToDeg(rad){
    return rad / Math.PI * 180;
}

function copyToClipboard(str){
   let el = document.createElement('textarea');
   el.value = str;
   el.setAttribute('readonly', '');
   el.style = {position: 'absolute', left: '-9999px'};
   document.body.appendChild(el);
   el.select();
   document.execCommand('copy');
   document.body.removeChild(el);
}

// function en(c){var x='charCodeAt',b,e={},f=c.split(""),d=[],a=f[0],g=256;for(b=1;b<f.length;b++)c=f[b],null!=e[a+c]?a+=c:(d.push(1<a.length?e[a]:a[x](0)),e[a+c]=g,g++,a=c);d.push(1<a.length?e[a]:a[x](0));for(b=0;b<d.length;b++)d[b]=String.fromCharCode(d[b]);return d.join("")}

// function de(b){var a,e={},d=b.split(""),c=f=d[0],g=[c],h=o=256;for(b=1;b<d.length;b++)a=d[b].charCodeAt(0),a=h>a?d[b]:e[a]?e[a]:f+c,g.push(a),c=a.charAt(0),e[o]=f+c,o++,f=a;return g.join("")}


// function base64EncodeUnicode(str) {
//     // First we escape the string using encodeURIComponent to get the UTF-8 encoding of the characters, 
//     // then we convert the percent encodings into raw bytes, and finally feed it to btoa() function.
//     utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
//             return String.fromCharCode('0x' + p1);
//     });
//     return btoa(utf8Bytes);
// }

function transformPoint(matrix, x, y){
    return [matrix.a*x + matrix.c*y + matrix.e, matrix.b*x + matrix.d*y + matrix.f];
}

function getXScale(matrix){
    return matrix.a;
}

function scaleMatrix(matrix, scale){
    matrix[0] *= scale;
    matrix[4] *= scale;
    return matrix;
}

function translateMatrix(matrix, x, y){
    matrix[2] += x*matrix[0];
    matrix[5] += y*matrix[4];
}

function getInvertedMatrix(m){
    let m2 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    m2[0] = m[4]*m[8] - m[5]*m[7];
    m2[1] = -(m[1]*m[8] - m[2]*m[7]);
    m2[2] = m[1]*m[5] - m[2]*m[4];
    m2[3] = -(m[3]*m[8] - m[5]*m[6]);
    m2[4] = m[0]*m[8] - m[2]*m[6];
    m2[5] = -(m[0]*m[5] - m[2]*m[3]);
    m2[6] = m[3]*m[7] - m[4]*m[6];
    m2[7] = -(m[0]*m[7] - m[1]*m[6]);
    m2[8] = m[0]*m[4] - m[1]*m[3];

    let det = m[0]*m2[0] + m[1]*m2[3] + m[2]*m[6];
    m2 = m2.map(x => x/det);

    return m2;
}

function resetMatrix(matrix){
    matrix[0] = 1;
    matrix[1] = 0;
    matrix[2] = 0;

    matrix[3] = 0;
    matrix[4] = 1;
    matrix[5] = 0;
    
    matrix[6] = 0;
    matrix[7] = 0;
    matrix[8] = 1;
}

function applyMatrix(ctx, matrix){
    ctx.setTransform(matrix[0], matrix[3], matrix[1], matrix[4], matrix[2], matrix[5]);
}

function transformPointMatrix(x, y, matrix){
    return [matrix[0]*x + matrix[1]*y + matrix[2], matrix[3]*x + matrix[4]*y + matrix[5]];
}

function zoomMatrixAround(matrix, x, y, zoom){
    [x, y] = transformPointMatrix(x, y, getInvertedMatrix(matrix));
    // this.translate(x, y);
    translateMatrix(matrix, x, y);
    // this.scale(factor,factor);
    scaleMatrix(matrix, zoom);
    // this.translate(-x, -y);
    translateMatrix(matrix, -x, -y);


    // [x, y] = transformPoint(x, y, this.getTransform().invertSelf());
    // this.translate(x, y);
    // this.scale(factor,factor);
    // this.translate(-x, -y);
}


function pointStringToInts(input){
    return input.split(", ").map(function(item){return parseInt(item)});
    
}

function randomRGB(alpha=1){
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    return "rgba("+r+", "+b+", "+g+", "+alpha+")";
}

function runOnComplete(object, callback) {
    if (object.complete) {
        callback(object);
    } else {
        object.addEventListener('load', function(){callback(object)});
        object.addEventListener('error', function () {
            alert('error');
        })
    }

}



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

// function parseDate(text){
//     if (text.length < 2) return false;
//     if (text.substring(0, 2) == "20")
//         text = text.substring(2, text.length);
//     if (text.length < 4) return false;

//     let year = parseInt("20" + text.substring(0, 2))
//     let month = parseInt(text.substring(2, 4)) - 1;
//     if(text.length == 6){
//         let day = parseInt(text.substring(4, 6))
//         return new Date(year, month, day);
//     }
//     return new Date(year, month);
// }


function precise(x, digits){
    // return Number.parseFloat(x).toPrecision(digits);
    return parseFloat(Number.parseFloat(x).toPrecision(digits));
}

// Math

function dist2D(p1, p2){
    let d_x = p1[0] - p2[0];
    let d_y = p1[1] - p2[1];
    return Math.sqrt( d_x*d_x + d_y*d_y );
}

// Database

function getDamageMod(damageType, target){
    return damage_dataset.getCellByString(damageType, "Name", target)
}


function angleDifference(angle1, angle2){
    angle1 %= Math.PI*2;
    angle2 %= Math.PI*2;
    if (angle1 < 0) angle1 += 2*Math.PI;
    if (angle2 < 0) angle2 += 2*Math.PI;

    let diff = Math.abs(angle1 - angle2);
    if (diff > Math.PI) return 2*Math.PI - diff;
    return diff;
}


function contains(str, query_arr, case_sensitive=false, exact_match=false){
    var value = 0;
    if (!case_sensitive){
        str = str.toLowerCase();
        for (i=0; i<query_arr.length; i++) query_arr[i] = query_arr[i].toLowerCase();
    }
    if(!exact_match) query_arr.forEach((query) => { value = value + str.includes(query) });
    else query_arr.forEach((query) => { value = value + (str==query) });
    return (value > 0);
}

// Projectile arcs



// function searchAngle(speed, drop, start_height, target_point){
function searchAngle(start_point, target_point, speed, drop){
    // Return angle required to hit point.
    let x_dist = dist2D(start_point, target_point);
    let start_height = start_point[2];
    let target_height = target_point[2];


    let y;
    let angle = - Math.PI / 2;
    let angle_step = Math.PI / 50;
    let max_loops = Math.PI / angle_step + 2;
    let loops = 0;

    // First find out if target is reachable, and figure out rough angle
    do{
        if (loops > max_loops){
            console.log("Hit not possible.");
            return 0;
            // break;
        }
        loops++;
        
        let t = tAtHit(speed, angle, x_dist);
        y = projectilePos(t, speed, angle, drop, start_height)[1];
        angle += angle_step;
        // console.log("Testing angle: ", precise(angle/Math.PI,3), " : ", precise(y, 3), " : ", precise(target_point[1], 3))
        
    }while(y < target_height);
    angle -= angle_step;

    // Search for correct angle
    let a1 = angle;
    let a2 = angle - angle_step;
    for (i=0; i<5; i++){
        let a3 = (a1 + a2) / 2;
        let t1 = tAtHit(speed, a1, x_dist);
        let t2 = tAtHit(speed, a2, x_dist);
        let t3 = tAtHit(speed, a3, x_dist);

        let d1 = projectilePos(t1, speed, a1, drop, start_height)[1] - target_height;
        let d2 = projectilePos(t2, speed, a2, drop, start_height)[1] - target_height;
        let d3 = projectilePos(t3, speed, a3, drop, start_height)[1] - target_height;
        
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
    return a1;
    // return getProjectileArc(speed, a1, start_height, drop, 0, tAtHit(speed, a1, target_point[0]), 100);
}

// trigonometry yo

function getProjectileArc(speed, angle, start_height, drop, start, end, steps){
    // Return list of points containing the projectile arc.
    let points = [];
    for (let i=0; i<steps; i++){
        let t = start + (end - start) * i / steps;
        points.push(projectilePos(t, speed, angle, drop, start_height));
    }
    return points;
}

function projectilePos(t, speed, angle, drop, start_height){
    // Return projectile position after t seconds
    return [speed * Math.cos(angle) * t,
            speed * Math.sin(angle) * t - drop/2 * Math.pow(t, 2) + start_height];
}

function tAtHit(speed, angle, target_x){
    // Return time that projectile reaches target
    return target_x/(speed * Math.cos(angle));
}


// Damage calculations


function laserAvgDamage(gun_data, ammo_data, distance, time) {
    // Hardcoded numbers, very sad :(
    let chargeup_time = 1;
    let damage_falloff_start = 300 * ammo_data["projectile speed"];
    let damage_falloff_per_second = 1.65;    

    // Damage falloff starts at 300m scales linearly
    let distance_modifier = distance > damage_falloff_start ? 
        1 - damage_falloff_per_second * (distance - damage_falloff_start) / (gun_data["proectile speed"] * ammo_data["projectile speed"]) : 
        1;

    // Laser chargeup damage modifier
    let active_time = Math.max(0, time - chargeup_time);

    let t_r = Math.min(6, active_time);
    let final_ramping_damage = 1 + 3 * (t_r / 6);
    let avg_ramping_damage = (1 + final_ramping_damage) / 2;

    let t_s = active_time - t_r;
    let damage_stable = 4;

    let time_modifier = active_time <= 0 ? 0 : (t_r * avg_ramping_damage + t_s * damage_stable) / active_time;

    // Avg damage per hit.
    let laser_damage_modifier = time_modifier * distance_modifier;
    // console.log("Distance modifier: ", distance_modifier);
    // console.log("Time modifier: ", time_modifier);
    // console.log("Damage modifier: ", laser_damage_modifier);
    return laser_damage_modifier;


   
}

// Array.prototype.injectArray = function( idx, arr ) {
//     return this.slice( 0, idx ).concat( arr ).concat( this.slice( idx ) );
// };

CanvasRenderingContext2D.prototype.zoomAround = function(x, y, factor){
    [x, y] = transformPoint(x, y, this.getTransform().invertSelf());
    this.translate(x, y);
    this.scale(factor,factor);
    this.translate(-x, -y);
}

$.fn.inputFilter = function (inputFilter) {
    return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function () {
      if (inputFilter(this.value)) {
        this.oldValue = this.value;
        this.oldSelectionStart = this.selectionStart;
        this.oldSelectionEnd = this.selectionEnd;
      } else if (this.hasOwnProperty("oldValue")) {
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      }
    });
};


function sanitizeHtml(str){
    str = String(str);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function loadImages(files, onAllLoaded){
    var numLoading = files.length;
    const onload = () => --numLoading === 0 && onAllLoaded(images);
    const images = [];
    for (let i = 0; i < files.length; ++i){
        const img = new Image;
        images.push(img);
        img.src = files[i];
        img.onload = onload;
    }
    return images;
}

async function loadImagesAsync(imgSources) {
    const promises = [];
    for (let src of imgSources){
        promises.push(loadImageAsync(src));
    }
    return Promise.all(promises);
}

async function loadImageAsync(imgSrc) {
    const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imgSrc;
        img.onload = () => resolve(img);
    });
    return promise;
}

function httpxPostRequest(url, data, callback=null, timeout_callback=null){
    let xhttp = new XMLHttpRequest();
    xhttp.timeout = 10000;
    xhttp.open("POST", url);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.onreadystatechange = callback;
    xhttp.ontimeout = timeout_callback;
    xhttp.send(JSON.stringify(data));
}

function httpxGetRequest(url, callback=null, timeout_callback=null){
    let xhttp = new XMLHttpRequest();
    xhttp.open("GET", url);
    xhttp.timeout = 10000;
    // xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.onload = callback;
    xhttp.ontimeout = timeout_callback;
    xhttp.send();
}

