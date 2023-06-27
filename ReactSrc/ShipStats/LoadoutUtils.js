// Guns are indexed differently in game internals and ui.
const SHIP_GUN_IDX_MAP = {
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
    // const pattern = {
    //     ignoredGunIndexes: [0, 1, 2, 3, 4, 5],
    //     ignoreGunPositions: false,
    //     // mirrorGunSlots: [[[0, 1], [2, 3], [4, 5]]]};
    //     mirrorGunSlots: [[[1, 3, 5], [2, 4, 6]]]
    // };

    // const mappedIdObj = [{ model: loadoutObj.M }];
    // console.log(loadoutString);

    const outObj = [loadoutObj[0]];
    const model = loadoutObj[0].model;

    for (const part of loadoutObj) {
        if (part.G != undefined) {
            let mappedIdx = part.G;
            if (SHIP_GUN_IDX_MAP[model] != undefined) mappedIdx = SHIP_GUN_IDX_MAP[model][part.G];
            if ( options.ignoredGunIndexes[mappedIdx] == true ) continue;
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

export function mergeLoadoutInfos(loadoutInfos, options) {
    const mergedLoadoutInfoMap = {};
    for (const loadoutInfo of loadoutInfos) {
        const loadoutId = mapLoadoutId(loadoutInfo._id, options);
        if (mergedLoadoutInfoMap[loadoutId] == undefined) {
            mergedLoadoutInfoMap[loadoutId] = {
                _id: loadoutId,
                PlayedGames: 0,
                Wins: 0,
                Mirrors: 0
            }
        }
        const mergedloadoutInfo = mergedLoadoutInfoMap[loadoutId];
        mergedloadoutInfo.PlayedGames += loadoutInfo.PlayedGames;
        mergedloadoutInfo.Wins += loadoutInfo.Wins;
        mergedloadoutInfo.Mirrors += loadoutInfo.Mirrors;
    }
    const mergedLoadoutInfos = Object.values(mergedLoadoutInfoMap);
    mergedLoadoutInfos.sort((a, b) => b.PlayedGames - a.PlayedGames);
    // console.log("LOADOUTS");
    // console.log(mergedLoadoutInfos);
    // console.log(mergedLoadoutInfoMap);
    return mergedLoadoutInfos;
}

export function mergeMatchupStats(loadoutStatsArr) {
    const mergedLoadoutStatsMap = {};

    for (const loadoutStats of loadoutStatsArr) {
        const loadoutId = mapLoadoutId(loadoutStats._id);
        if (mergedLoadoutStatsMap[loadoutId] == undefined) {
            mergedLoadoutStatsMap[loadoutId] = {
                _id: loadoutId,
                count: 0,
                PlayedVs: 0,
                PlayedWith: 0,
                WinsVs: 0,
                WinsWith: 0
            }
        }
        const mergedLoadoutStats = mergedLoadoutStatsMap[loadoutId];
        mergedLoadoutStats.count += loadoutStats.count;
        mergedLoadoutStats.PlayedVs += loadoutStats.PlayedVs;
        mergedLoadoutStats.PlayedWith += loadoutStats.PlayedWith;
        mergedLoadoutStats.WinsVs += loadoutStats.WinsVS;
        mergedLoadoutStats.WinsWith += loadoutStats.WinsWith;
    }

    const mergedLoadoutStats = Object.values(mergedLoadoutStatsMap);
    mergedLoadoutStats.sort((a, b) => b.count - a.count);
    console.log("MATCHUPS");
    console.log(mergedLoadoutStats);
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