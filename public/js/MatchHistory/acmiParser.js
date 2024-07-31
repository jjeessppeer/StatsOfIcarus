const timestampRgx = /^#([\d]*\.?[\d]*)$/;  // Match timestamp line
const objectRgx = /^([0-9A-Fa-f]*),(.*)$/;  // Match object description line
const propRgx = /([\w]*)=([\w|\-\.]*)/g;    // Match single property definition

export function parseObjectTimelines(acmiFile) {
    // Parse an acmi text file into arrays of objects property timelines.
    
    let objectTimelines = {};
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
            }
            
            // Insert properties in timeline.
            // Merge properties updating on the same timestamp.
            let idx = objectTimelines[objectId].findIndex(el => el.timestamp == lastTimestamp);
            if (idx === -1) {
                objectTimelines[objectId].push({timestamp: lastTimestamp, properties: properties});
            }
            else {
                objectTimelines[objectId][idx].properties = {
                    ...objectTimelines[objectId][idx].properties, 
                    ...properties };
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

export function getShipPaths(acmiObjectTimeline, startTimestamp, endTimestamp, timeResolution=2) {
    const shipPaths = {};
    for (const objectId in acmiObjectTimeline) {
        if (objectId.substring(0, 2) !== "01") continue;
        shipPaths[objectId] = [];
        for (let t = startTimestamp; t <= endTimestamp; t += timeResolution) {
            const transform = getPropertyValue(acmiObjectTimeline, objectId, "T", t);
            const position = parseAcmiTransform(transform);
            shipPaths[objectId].push({timestamp: t, position});
        }
    }
    return shipPaths;
}

export function getPropertyValue(acmiObjectTimeline, objectId, propertyKey, targetTimestamp, interpolate=false) {
    // Very inefficient search for property value at given time.
    let value, prevValue;
    for (const timelineObj of acmiObjectTimeline[objectId]) {
        const properties = timelineObj.properties;
        const timestamp = timelineObj.timestamp;
        if (propertyKey in properties) {
            prevValue = value;
            value = properties[propertyKey];
            if (targetTimestamp <= timestamp) {
                break;
            }
            
        }
    }
    if (prevValue !== undefined) return prevValue;
    return value;
}

// export function generateShipPosition

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