const timestampRgx = /^#([\d]*\.?[\d]*)$/;  // Match timestamp line
const objectRgx = /^([0-9A-Fa-f]+),(.*)$/;  // Match object description line
const objRemoveRgx = /^-([0-9A-Fa-f]+)$/;    // Match object removal line
const propRgx = /([\w]*)=([\w|\-\.]*)/g;    // Match single property definition

export function parseObjectTimelines(acmiFile) {
    // Parse an acmi text file into arrays of objects property timelines.
    
    let objectTimelines = {};
    let objectsAlive = {};
    let lastTimestamp = 0;
    let startTimestamp, endTimestamp;
    let i, j = 0;
    while ((j = acmiFile.indexOf("\n", i)) !== -1) {
        const line = acmiFile.substring(i, j);
        i = j + 1;
        
        let timestamp = line.match(timestampRgx);
        if (timestamp  !== null) {
            lastTimestamp = Number.parseFloat(timestamp[1]);
            if (startTimestamp === undefined || lastTimestamp < startTimestamp)
                startTimestamp = lastTimestamp;
            if (endTimestamp === undefined || lastTimestamp > endTimestamp)
                endTimestamp = lastTimestamp;
        }

        const obj = line.match(objectRgx);
        if (obj) {
            const objectId = obj[1];
            const properties = parseObjectProperties(obj[2]);
            if (!(objectId in objectTimelines)) {
                objectTimelines[objectId] = [];
                objectsAlive[objectId] = false;
            }
            if (!objectsAlive[objectId]) {
                objectsAlive[objectId] = true;
                properties["alive"] = true;
                
            }
            addProperties(objectTimelines[objectId], properties, lastTimestamp)
        }

        const objRemove = line.match(objRemoveRgx);
        if (objRemove) {
            const objectId = objRemove[1];
            if (objectsAlive[objectId]) {
                objectsAlive[objectId] = false;
                addProperties(objectTimelines[objectId], {alive: false}, lastTimestamp);
            }
        }
    }

    for (const objectId in objectTimelines) {
        objectTimelines[objectId].sort((a, b) => a.timestamp - b.timestamp);
    }

    return [
        objectTimelines,
        startTimestamp,
        endTimestamp
    ];
}

function addProperties(objectTimeline, properties, timestamp) {
    // Insert properties in timeline.
    // Merge properties updating on the same timestamp.
    let idx = objectTimeline.findIndex(el => el.timestamp == timestamp);
    if (idx === -1) {
        objectTimeline.push({timestamp: timestamp, properties: properties});
    }
    else {
        objectTimeline[idx].properties = {
            ...objectTimeline[idx].properties, 
            ...properties };
    }
}

export function getShipPaths(acmiObjectTimeline, startTimestamp, endTimestamp, enabledShips, enabledTeams, timeResolution=2) {
    const shipPaths = {};
    for (const objectId in acmiObjectTimeline) {
        if (objectId.substring(0, 2) !== "01") continue;
        const team = parseInt(objectId.substring(2, 4));
        const ship = parseInt(objectId.substring(4, 6));
        if (!enabledShips[team * 2 + ship] || !enabledTeams[team]) continue;

        shipPaths[objectId] = [];
        for (let t = startTimestamp; t <= endTimestamp; t += timeResolution) {
            const transform = getPropertyValue(acmiObjectTimeline, objectId, "T", t);
            const position = parseAcmiTransform(transform);
            const alive = getPropertyValue(acmiObjectTimeline, objectId, "alive", t);
            shipPaths[objectId].push({timestamp: t, position, alive});
        }
    }
    return shipPaths;
}

export function getPropertyValue(acmiObjectTimeline, objectId, propertyKey, targetTimestamp, interpolate=false) {
    // Very inefficient search for property value at given time.
    let value;
    for (const timelineObj of acmiObjectTimeline[objectId]) {
        const properties = timelineObj.properties;
        const timestamp = timelineObj.timestamp;
        if (targetTimestamp <= timestamp && value != undefined) {
            break;
        }
        if (propertyKey in properties) {
            value = properties[propertyKey];
        }
    }
    // TODO: interpolate values.
    // TODO: data conversion.
    return value;
}

function parseObjectProperties(line) {
    const propMatches = line.matchAll(propRgx);
    const properties = {};
    for (const propMatch of propMatches) {
        properties[propMatch[1]] = propMatch[2];
    }
    return properties;
}

function parseAcmiTransform(transform) {
    const coords = transform.split("|");
    
    const circumference = 6378137 * 2 * Math.PI;
    const mToDeg = 360 / circumference; 
    return {
        x: parseFloat(coords[0]) / mToDeg,
        y: parseFloat(coords[1]) / mToDeg,
        z: parseFloat(coords[2]),
        angle: coords.length >= 6 ? parseFloat(coords[5]) : 0
    }
}

function longlatToXYZ(longitude, latitude, altitude) {
    const circumference = 6378137 * 2 * Math.PI;
    const mToDeg = 360 / circumference;
    return {
        x: longitude / mToDeg, 
        y: latitude / mToDeg, 
        z: altitude
    };
}