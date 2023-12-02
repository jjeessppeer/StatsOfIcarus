import { ship_scales, ship_offsets } from '/js/constants.js';

export function spreadGunPositions(gunPositions, iconSize, iterations = 10, xRange, yRange) {
    let adjustedPositions = [];
    const movementStrength = 1 / 10;
    for (let i = 0; i < gunPositions.length; i++) {
        let pos = [
            gunPositions[i][0] + 0,
            gunPositions[i][1] + 0
        ];
        for (let j = 0; j < gunPositions.length; j++) {
            if (i == j) continue;
            let vector = [
                gunPositions[j][0] - gunPositions[i][0],
                gunPositions[j][1] - gunPositions[i][1]
            ];
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

            if (xRange != undefined) {
                // Push icons away from borders
                const xMin = xRange[0];
                const xMax = xRange[1];
                const d1 = Math.min(xMax - iconSize - pos[0], 0);
                const d2 = Math.max(xMin + iconSize - pos[0], 0);
                pos[0] += d1 / 5;
                pos[0] += d2 / 5;
            }

        }
        adjustedPositions.push(pos);
    }
    if (iterations > 1) adjustedPositions = spreadGunPositions(adjustedPositions, iconSize, iterations - 1);
    return adjustedPositions;
}

export function toShipImageCoordinates(point, shipModel, shipImage) {
    return [
        point[0] * ship_scales[shipModel] + shipImage.width / 2,
        point[1] * -ship_scales[shipModel] + ship_offsets[shipModel]]
}

export function getShipLoadout(matchRecord, shipLoadoutId) {
    for (let ship of matchRecord.ShipLoadouts) {
        if (ship._id == shipLoadoutId) return ship;
    }
    throw "No ship with specified id found";
}

export function getPlayerInfo(matchRecord, playerId) {
    for (let player of matchRecord.PlayerInfo) {
        if (player._id == playerId) return player;
    }
    throw "No player with specified id found " + playerId;
}

export function getLoadoutInfo(matchRecord, loadoutId) {
    for (let loadout of matchRecord.LoadoutInfo) {
        if (loadout._id == loadoutId) return loadout;
    }
    throw "No loadout with specified id found";
}

export function getSkillItem(matchRecord, skillId) {
    for (let skill of matchRecord.SkillItems) {
        if (skill._id == skillId) return skill;
    }
    throw "No skill with specified id found";
}

export function getShipItem(matchRecord, shipId) {
    for (let ship of matchRecord.ShipItems) {
        if (ship._id == shipId) return ship;
    }
    throw "No ship item with specified id found: " + shipId;
}