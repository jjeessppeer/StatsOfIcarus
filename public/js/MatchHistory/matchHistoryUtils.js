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