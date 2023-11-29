// export const MAP_IMAGES = {
//   66: "images/map-images/Fjords.jpg",
//   // 314: "Derelict"
//   80: "images/map-images/Paritan.jpg",
//   289: "images/map-images/Thornholtjpg.jpg",
//   126: "images/map-images/Water_Hazard.jpg",
//   9: "images/map-images/Dunes.jpg",
//   // 9: "images/map-images/Duel_at_Dawn.jpg",
// }

export function positionToCanvasPixel(worldPoint, mapItem, canvasWidth, value) {
  if (typeof worldPoint == 'string')
    worldPoint = JSON.parse(worldPoint);
  const imageBaseWidth = 990;
  const imageScale = canvasWidth / imageBaseWidth;
  // let offsets = MAP_OFFSET[mapId];
  // let pxPerMeter = MAP_SCALE[mapId];

  const cx = (mapItem.BoundryMax.X + mapItem.BoundryMin.X) / 2;
  const cz = (mapItem.BoundryMax.Z + mapItem.BoundryMin.Z) / 2;
  let mapScale = (990 - 44) / Math.max(mapItem.BoundryMax.X - mapItem.BoundryMin.X, mapItem.BoundryMax.Z - mapItem.BoundryMin.Z);
  let offsetX = 495 - mapScale * cx;
  let offsetZ = 495 + mapScale * cz;

  const pixelPosition = [
    (worldPoint[0] * mapScale + offsetX) * imageScale,
    (-worldPoint[2] * mapScale + offsetZ) * imageScale,
    value
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

export function filterPositonData(positionData, minT, maxT, enabledShips, enabledTeams) {
  const out = JSON.parse(JSON.stringify(positionData));
  for (let s = out.length - 1; s >= 0; s--) {
    if (enabledShips[out[s].TeamIdx * 2 + out[s].ShipIdx] && enabledTeams[out[s].TeamIdx]) continue;
    out.splice(s, 1);
  }

  for (let s = 0; s < out.length; s++) {
    const shipPositions = out[s];
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

export function fixPositionData(positionData, matchData) {
  // TODO: make generic for team size.
  // TODO: move to server side.
  const out = JSON.parse(JSON.stringify(positionData));
  out.sort((a, b) => (a.Timestamp.length - b.Timestamp.length));
  const removalIdxs = [];

  // Get ships per team and remove invalid teams.
  const teamShipCount = [0, 0];
  for (let i = out.length - 1; i >= 0; i--) {
    if (out[i].TeamIdx != 0 && out[i].TeamIdx != 1) {
      removalIdxs.push(i);
    }
    else {
      teamShipCount[out[i].TeamIdx] += 1;
    }
  }

  // Add the extra ships for removal.
  for (let i = 0; i < teamShipCount.length; i++) {
    while (teamShipCount[i] > 2) {
      const rmIdx = out.findIndex((el) => el.TeamIdx == i);
      if (rmIdx == -1) break;
      teamShipCount[i]--;
      removalIdxs.push(rmIdx);
    }
  }

  // Execute removal.
  removalIdxs.sort();
  for (let i = removalIdxs.length - 1; i >= 0; i--) {
    out.splice(removalIdxs[i], 1);
  }

  // Fix ship indexes.
  const shipCount = [0, 0];
  out.sort((a, b) => ((a.TeamIdx != b.TeamIdx ? a.TeamIdx - b.TeamIdx : a.ShipIdx - b.ShipIdx)));
  for (let i = 0; i < out.length; i++) {
    out[i].ShipIdx = shipCount[out[i].TeamIdx]++;
  }

  return out;
}