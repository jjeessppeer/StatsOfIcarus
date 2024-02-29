function updateQueryParams(urlParams) {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const params = urlParams.length === 0 ? "" : `?${urlParams}`;
    console.log(params);
    const newUrl = `${protocol}//${host}${pathname}${params}${hash}`;
    window.history.pushState({path:newUrl},'',newUrl);
}

function getCookie(cookiename) {
    var cookiestring = RegExp("" + cookiename + "[^;]+").exec(document.cookie);
    return decodeURIComponent(!!cookiestring ? cookiestring.toString().replace(/^[^=]+./, "") : "");
}

function setCookie(name, value) {
    document.cookie = name + "=" + value;
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}

function radToDeg(rad) {
    return rad / Math.PI * 180;
}

function copyToClipboard(str) {
    let el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style = { position: 'absolute', left: '-9999px' };
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}

function precise(x, digits) {
    // return Number.parseFloat(x).toPrecision(digits);
    return parseFloat(Number.parseFloat(x).toPrecision(digits));
}

function angleDifference(angle1, angle2) {
    angle1 %= Math.PI * 2;
    angle2 %= Math.PI * 2;
    if (angle1 < 0) angle1 += 2 * Math.PI;
    if (angle2 < 0) angle2 += 2 * Math.PI;

    let diff = Math.abs(angle1 - angle2);
    if (diff > Math.PI) return 2 * Math.PI - diff;
    return diff;
}


function contains(str, query_arr, case_sensitive = false, exact_match = false) {
    var value = 0;
    if (!case_sensitive) {
        str = str.toLowerCase();
        for (i = 0; i < query_arr.length; i++) query_arr[i] = query_arr[i].toLowerCase();
    }
    if (!exact_match) query_arr.forEach((query) => { value = value + str.includes(query) });
    else query_arr.forEach((query) => { value = value + (str == query) });
    return (value > 0);
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
    return laser_damage_modifier;



}

CanvasRenderingContext2D.prototype.zoomAround = function (x, y, factor) {
    [x, y] = transformPoint(x, y, this.getTransform().invertSelf());
    this.translate(x, y);
    this.scale(factor, factor);
    this.translate(-x, -y);
}

// $.fn.inputFilter = function (inputFilter) {
//     return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function () {
//       if (inputFilter(this.value)) {
//         this.oldValue = this.value;
//         this.oldSelectionStart = this.selectionStart;
//         this.oldSelectionEnd = this.selectionEnd;
//       } else if (this.hasOwnProperty("oldValue")) {
//         this.value = this.oldValue;
//         this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
//       }
//     });
// };


function sanitizeHtml(str) {
    str = String(str);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function loadImages(files, onAllLoaded) {
    var numLoading = files.length;
    const onload = () => --numLoading === 0 && onAllLoaded(images);
    const images = [];
    for (let i = 0; i < files.length; ++i) {
        const img = new Image;
        images.push(img);
        img.src = files[i];
        img.onload = onload;
    }
    return images;
}

async function loadImagesAsync(imgSources) {
    const promises = [];
    for (let src of imgSources) {
        promises.push(loadImageAsync(src));
    }
    return Promise.all(promises);
}

const imgCache = {};
async function loadImageAsync(imgSrc) {
    if (imgCache[imgSrc]) return imgCache[imgSrc];
    const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.src = imgSrc;
        img.onload = () => {
            imgCache[imgSrc] = img;
            resolve(img)
        };
    });
    return promise;
}

function addChartData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    // chart.update();
}

// function setChartData(chart, )

function removeChartData(chart) {
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    // chart.update();
}

function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
}

function spreadPoints(points, iconSize, iterations = 10) {
    let adjustedPositions = [];
    const movementStrength = 1 / 10;

    for (let i = 0; i < points.length; i++) {
        let pos = [
            points[i][0] + 0,
            points[i][1] + 0
        ];
        for (let j = 0; j < points.length; j++) {
            if (i == j) continue;
            let vector = [
                points[j][0] - points[i][0],
                points[j][1] - points[i][1]
            ];
            let xDist = vector[0];
            let yDist = vector[1];

            let distSq = vector[0] * vector[0] + vector[1] * vector[1];
            let dist = Math.sqrt(distSq);
            let vectorNorm = [
                vector[0] / dist,
                vector[1] / dist
            ];
            if (dist < iconSize) {
                pos[0] -= vectorNorm[0] * iconSize * movementStrength;
                pos[1] -= vectorNorm[1] * iconSize * movementStrength;
            }
        }
        adjustedPositions.push(pos);
    }
    if (iterations > 1) adjustedPositions = spreadGunPositions(adjustedPositions, iconSize, iterations - 1);
    return adjustedPositions;
}