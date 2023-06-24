// import { create, createReportList } from './modules/canvas.js';
// import { name, draw, reportArea, reportPerimeter } from './modules/square.js';
// import randomSquare from './modules/square.js';
// import {name} from './mod.js';
// console.log(name);

// let myCanvas = create('myCanvas', document.body, 480, 320);
// let reportList = createReportList(myCanvas.id);

// let square1 = draw(myCanvas.ctx, 50, 50, 100, 'blue');
// reportArea(square1.length, reportList);
// reportPerimeter(square1.length, reportList);

// // Use the default
// let square2 = randomSquare(myCanvas.ctx);



// import './React/ShipStats/LoadoutOverviewCard.js';
// import {ShipCanvas} from './React/ShipCanvas.js';
import { ShipLoadoutInfo, ShipOverview, ShipLoadoutInfoList } from './React/ShipStats/LoadoutOverviewCard.js';





function mapLoadoutId(loadoutString) {
    const loadoutObj = JSON.parse(loadoutString);
    const pattern = {
        ignoredGunIndexes: [],
        ignoreGunPositions: false, 
        // mirrorGunSlots: [[[0, 1], [2, 3], [4, 5]]]};
        mirrorGunSlots: [[[1, 3, 5], [2, 4, 6]]]};

    const mappedIdObj = [{model: loadoutObj.M}];

    let guns = [];
    for (let gunIdx = 0; gunIdx < loadoutObj.G.length; gunIdx++) {
        if (pattern.ignoredGunIndexes.includes(gunIdx)) continue;
        mappedIdObj.push({G: gunIdx, gun: loadoutObj.G[gunIdx]});
    }

    // // TODO: Sort mirrored gun slots.


    const mappedLoadoutStr = JSON.stringify(mappedIdObj);
    // console.log(loadoutString, ' -> ', mappedLoadoutStr);
    return mappedLoadoutStr;

}

function mergeLoadoutInfos(loadoutInfos) {
    const mergedLoadoutInfoMap = {};
    for (const loadoutInfo of loadoutInfos) {
        const loadoutId = mapLoadoutId(loadoutInfo.LoadoutStats._id);
        if (mergedLoadoutInfoMap[loadoutId] == undefined) {
            mergedLoadoutInfoMap[loadoutId] = {
                _id: loadoutId,
                PlayedGames: 0,
                TotalGames: loadoutInfo.Count[0].count,
                Wins: 0
            }
        }
        const mergedloadoutInfo = mergedLoadoutInfoMap[loadoutId];
        mergedloadoutInfo.PlayedGames += loadoutInfo.LoadoutStats.PlayedGames;
        mergedloadoutInfo.Wins += loadoutInfo.LoadoutStats.Wins;
    }
    const mergedLoadoutInfos = Object.values(mergedLoadoutInfoMap);
    mergedLoadoutInfos.sort((a, b) => b.PlayedGames - a.PlayedGames);
    console.log("LOADOUTS");
    console.log(mergedLoadoutInfos);
    // console.log(mergedLoadoutInfoMap);
    return mergedLoadoutInfos;
}

function mergeMatchupStats(loadoutStatsArr) {
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


async function getLoadoutList() {
    const rawRes = await fetch('/ship_loadouts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ShipModel: 16 })
    });
    const res = await rawRes.json();
    // console.log(res);

    // mapLoadoutId(res[0].LoadoutStats._id);
    return mergeLoadoutInfos(res);
}

async function getLoadoutStats() {
    const rawRes = await fetch('/ship_matchup_stats', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ TargetShip: { Model: 16 } })
    });
    const res = await rawRes.json();
    // console.log(res);
    return mergeMatchupStats(res);
}

async function start() {
    console.log("FETCHING SHIP LOADOUTS");
    const loadoutList = await getLoadoutList();
    await getLoadoutStats();




    const domContainer = document.querySelector('#matchHistory .right-area');
    const root = ReactDOM.createRoot(domContainer);
    const rateProps = { picks: 10, totalPicks: 20, matches: 4, totalMatches: 5, wins: 7 };
    const el = React.createElement(ShipLoadoutInfoList, { loadoutInfos: loadoutList })
    root.render(el);
}
start();
// console.log(el)
// el.setState({shipModel: 14});

