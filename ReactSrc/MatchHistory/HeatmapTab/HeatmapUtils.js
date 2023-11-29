export const MAP_IMAGES = {
  66: "images/map-images/Fjords.jpg",
  // 314: "Derelict"
  80: "images/map-images/Paritan.jpg",
  289: "images/map-images/Thornholtjpg.jpg",
  126: "images/map-images/Water_Hazard.jpg"
}

const MAP_SCALE = {
  66: 0.236,
  80: 472 / 1000,
  126: 609 / 2000,

  289: 472 / 1500,
}

const MAP_OFFSET = {
  // (-1014.6 : 2001.5) => (790, 586)
  // __: {x: __ - -__ * MAP_SCALE[__], z: __ + __ * MAP_SCALE[__]},
  // __: {x: p_x - w_x * MAP_SCALE[__], z: p_z + w_z * MAP_SCALE[__]},
  66: { x: 790 - -1014.6 * MAP_SCALE[66], z: 586 + 2001.5 * MAP_SCALE[66] },
  80: { x: 166 - -942.5 * MAP_SCALE[80], z: 528 + -68.3 * MAP_SCALE[80] },
  126: { x: 220 - -2082.9 * MAP_SCALE[126], z: 308 + 2961.9 * MAP_SCALE[126] },

  289: { x: 166 - -942.5 * MAP_SCALE[80] - 300, z: 528 + -68.3 * MAP_SCALE[80] + 50 },
}

export function positionToCanvasPixel(worldPoint, mapId, canvasWidth) {
  if (typeof worldPoint == 'string')
    worldPoint = JSON.parse(worldPoint);
  const imageBaseWidth = 990;
  const imageScale = canvasWidth / imageBaseWidth;
  let offsets = MAP_OFFSET[mapId];
  let pxPerMeter = MAP_SCALE[mapId];
  if (!offsets) {
    offsets = [0, 0];
    pxPerMeter = 1;
  }
  const pixelPosition = [
    (worldPoint[0] * pxPerMeter + offsets.x) * imageScale,
    (-worldPoint[2] * pxPerMeter + offsets.z) * imageScale,
    0.1
  ];
  return pixelPosition;
}

export function getDeaths(positionData) {
  // Return an array of the second ships died at and their team index.
  const deaths = [];
  for (const shipPositions of positionData) {
    for (let i = 0; i < shipPositions.Position.length; i++) {
      if (shipPositions.Dead[i]) {
        deaths.push({
          position: JSON.parse(shipPositions.Position[i]),
          timestamp: shipPositions.Timestamp[i],
          teamIdx: shipPositions.TeamIdx,
          shipIdx: shipPositions.ShipIdx,
        });
      }
    }
  }
  return deaths;
}

export function getEndTimestamp(positionData) {
  let timestampMax = 0;
  for (const shipPositions of positionData) {
    let timestamp = shipPositions.Timestamp[shipPositions.Timestamp.length - 1];
    timestampMax = Math.max(timestamp, timestampMax);
  }
  return timestampMax;
}

export function filterPositonData(positionData, minT, maxT) {
  const out = JSON.parse(JSON.stringify(positionData));
  for (const shipPositions of out) {
    for (let i = 0; i < shipPositions.Timestamp.length; i++) {
      if (shipPositions.Timestamp[i] < minT || shipPositions.Timestamp[i] > maxT) {
        shipPositions.Dead.splice(i, 1);
        shipPositions.Forwards.splice(i, 1);
        shipPositions.Position.splice(i, 1);
        shipPositions.Timestamp.splice(i, 1);
        shipPositions.Velocity.splice(i, 1);
        i--;
      }
    }
  }
  return out;
}

// export function fixPositionData(positionData) {
//   // TODO: move to server side.
//   const out = JSON.parse(JSON.stringify(positionData));
//   return out;
// }