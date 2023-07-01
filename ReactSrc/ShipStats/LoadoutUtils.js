// Guns are indexed differently in game internals and ui.
export const SHIP_GUN_IDX_MAP = {
    11: { // Goldfish
        0: 1,
        1: 2,
        2: 0,
        3: 3
    },
    12: { // Junker
        0: 3,
        1: 4,
        2: 0,
        3: 2,
        4: 1
    },
    13: { // Squid
        0: 0,
        1: 1,
        2: 2
    },
    14: { // Galleon
        0: 5,
        1: 0,
        2: 1,
        3: 2,
        4: 3,
        5: 4
    },
    15: { // Spire
        0: 2,
        1: 3,
        2: 1,
        3: 0
    },
    16: { // Pyramidion
        0: 2,
        1: 3,
        2: 1,
        3: 0
    },
    19: { // Mobula
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        4: 4
    },
    64: { // Magnate
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5
    },
    67: { // Crusader
        0: 0,
        1: 1,
        2: 5,
        3: 4,
        4: 2,
        5: 3
    },
    69: { // Judgement
        0: 0,
        1: 3,
        2: 2,
        3: 1,
        4: 4
    },
    70: { // Corsair
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5
    },
    82: { // Shrike
        0: 0,
        1: 1,
        2: 2,
        3: 3
    },
    97: { // Stormbreaker
        0: 0,
        1: 1,
        2: 2,
        3: 3
    }
}

export function mapLoadoutId(loadoutString, options) {
    const loadoutObj = JSON.parse(loadoutString);

    const outObj = [loadoutObj[0]];
    const model = loadoutObj[0].model;

    for (const part of loadoutObj) {
        if (part.G != undefined) {
            let mappedIdx = part.G;
            if (SHIP_GUN_IDX_MAP[model] != undefined) mappedIdx = SHIP_GUN_IDX_MAP[model][part.G];
            if (options.ignoredGunIndexes[mappedIdx] == true) continue;
            outObj.push(part);

        }
        // if (part.G != undefined && options.ignoredGunIndexes[part.G] === true) continue;
        // // if (part.model != undefined)
        // outObj.push(part);
    }
    // console.log(outObj)

    return JSON.stringify(outObj);

    // let guns = [];
    // for (let gunIdx = 0; gunIdx < loadoutObj.G.length; gunIdx++) {
    //     if (pattern.ignoredGunIndexes.includes(gunIdx)) continue;
    //     mappedIdObj.push({G: gunIdx, gun: loadoutObj.G[gunIdx]});
    // }

    // // TODO: Sort mirrored gun slots.


    // const mappedLoadoutStr = JSON.stringify(mappedIdObj);
    // console.log(loadoutString, ' -> ', mappedLoadoutStr);
    // return mappedLoadoutStr;

}

export function eloWinrate(expectedOutcome, actualOutcome, playedGames) {
    const eR = expectedOutcome / playedGames;
    const aR = actualOutcome / playedGames;
    const f1 = 1 / 2 * (aR / eR);
    const f2 = 1 / 2 * (1 + (aR - eR) / (1 - eR));
    let f3;
    if (aR > eR) f3 = f2;
    else f3 = f1;
    return f3;
}

function mergeSumObjects(obj1, obj2, ignoreKeys = []) {
    for (const [key, value] of Object.entries(obj2)) {
        if (ignoreKeys.includes(key)) continue;
        if (obj1[key] == undefined) {
            obj1[key] = 0;
        }
        obj1[key] += value;
    }
    return obj1;
}


export function filterLoadoutArray(loadoutArr, options) {
    function hasGunInSlot(parts, gunId, slot) {
        const model = parts[0].model;
        const mappedSlot = SHIP_GUN_IDX_MAP[model][slot];
        for (const part of parts) {
            const mappedGun = SHIP_GUN_IDX_MAP[model][part.G];
            if (mappedGun == slot && part.gun == gunId) {
                console.log(JSON.stringify(parts));
                console.log("things: ", slot, mappedSlot, part.G, gunId, part.gun);
                return true;
            }
        }
        return false;
    }
    const filteredLoadoutInfos = [];
    function loadoutMatches(parts, gunSelections) {
        for (let i = 0; i < 6; i++) {
            const gunId = gunSelections[i];
            if (gunId == -1 || gunId == -2) continue;
            if (!hasGunInSlot(parts, gunId, i)) return false;
        }
        return true;
    }
    for (const l of loadoutArr) {
        const parts = JSON.parse(l._id);
        if (!loadoutMatches(parts, options.gunSelections)) continue;
        filteredLoadoutInfos.push(l);
    }
    return filteredLoadoutInfos;
}

export function mergeLoadoutInfos(loadoutInfos, options) {
    const mergedLoadoutInfoMap = {};
    for (const loadoutInfo of loadoutInfos) {
        const loadoutId = mapLoadoutId(loadoutInfo._id, options);
        if (mergedLoadoutInfoMap[loadoutId] == undefined)
            mergedLoadoutInfoMap[loadoutId] = {
                OriginalIds: [],
                _id: loadoutId
            };

        const mergedloadoutInfo = mergedLoadoutInfoMap[loadoutId];
        mergedloadoutInfo.OriginalIds.push(loadoutInfo._id);
        mergeSumObjects(mergedloadoutInfo, loadoutInfo, ['_id', 'OriginalIds']);
    }
    const mergedLoadoutInfos = Object.values(mergedLoadoutInfoMap);
    // mergedLoadoutInfos.sort((a, b) => b.PlayedGames - a.PlayedGames);
    // mergedLoadoutInfos.sort((a, b) => {
    //     const C = 100;
    //     const m = 0.30;
    //     const w1 = (C*m + b.Wins ) / (C + b.PlayedGames);
    //     const w2 = (C*m + a.Wins ) / (C + a.PlayedGames);
    //     return w1 - w2;
    // });
    mergedLoadoutInfos.sort((a, b) => {
        const C = 50;
        const m = 0.2;
        const e1 = eloWinrate(b.ExpectedOutcome, b.ActualOutcome, b.PlayedGames);
        const e2 = eloWinrate(a.ExpectedOutcome, a.ActualOutcome, a.PlayedGames);
        // const e2 = eloWinrate(a);
        const w1 = (C * m + e1 * b.PlayedGames) / (C + b.PlayedGames);
        const w2 = (C * m + e2 * a.PlayedGames) / (C + a.PlayedGames);
        return w1 - w2;
    });
    return mergedLoadoutInfos;
}

export function mergeMatchupStats(loadoutStatsArr, options) {
    const mergedLoadoutStatsMap = {};

    for (const loadoutStats of loadoutStatsArr) {
        const loadoutId = mapLoadoutId(loadoutStats._id, options);
        if (mergedLoadoutStatsMap[loadoutId] == undefined)
            mergedLoadoutStatsMap[loadoutId] = {
                _id: loadoutId,
                OriginalIds: []
            };

        const mergedLoadoutStats = mergedLoadoutStatsMap[loadoutId];
        mergedLoadoutStats.OriginalIds.push(loadoutStats._id);
        mergeSumObjects(mergedLoadoutStats, loadoutStats, ['_id', 'OriginalIds']);
    }
    // for (const loadoutStats of loadoutStatsArr) {
    //     const loadoutId = mapLoadoutId(loadoutStats._id, options);
    //     if (mergedLoadoutStatsMap[loadoutId] == undefined) {
    //         mergedLoadoutStatsMap[loadoutId] = {
    //             _id: loadoutId,
    //             count: 0,
    //             PlayedVs: 0,
    //             PlayedWith: 0,
    //             WinsVs: 0,
    //             WinsWith: 0,
    //             ActualOutcomeVs: 0,
    //             ExpectedOutcomeVs: 0
    //         }
    //     }
    //     const mergedLoadoutStats = mergedLoadoutStatsMap[loadoutId];
    //     mergedLoadoutStats.count += loadoutStats.count;
    //     mergedLoadoutStats.PlayedVs += loadoutStats.PlayedVs;
    //     mergedLoadoutStats.PlayedWith += loadoutStats.PlayedWith;
    //     mergedLoadoutStats.WinsVs += loadoutStats.WinsVs;
    //     mergedLoadoutStats.WinsWith += loadoutStats.WinsWith;
    //     mergedLoadoutStats.ExpectedOutcomeVs += loadoutStats.ExpectedOutcomeVs;
    //     mergedLoadoutStats.ActualOutcomeVs += loadoutStats.ActualOutcomeVs;
    // }

    const mergedLoadoutStats = Object.values(mergedLoadoutStatsMap);
    mergedLoadoutStats.sort((a, b) => b.count - a.count);
    return mergedLoadoutStats;

}

export function loadoutStringToCanvasData(loadoutString) {
    const partArr = JSON.parse(loadoutString);
    const model = partArr[0].model;

    const guns = [-1, -1, -1, -1, -1, -1];
    for (const part of partArr) {
        if (part.G != undefined) {
            guns[part.G] = part.gun;
        }
    }
    const canvasData = {
        shipModel: model,
        shipLoadout: guns,
    };
    return canvasData;
}