import { ShipLoadoutInfoList } from './React/ShipStats/LoadoutInfo.js';
import { mergeLoadoutInfos, mapLoadoutId, mergeMatchupStats } from '/React/ShipStats/LoadoutUtils.js';

async function getLoadoutList(shipModel) {
    const rawRes = await fetch('/ship_loadouts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ShipModel: shipModel })
    });
    const res = await rawRes.json();
    // mapLoadoutId(res[0].LoadoutStats._id);
    // return mergeLoadoutInfos(res);
    return res
}

// async function getLoadoutStats() {
//     const rawRes = await fetch('/ship_matchup_stats', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ TargetShip: { Model: 16 } })
//     });
//     const res = await rawRes.json();
//     return res;
// }

async function start() {
    console.log("FETCHING SHIP LOADOUTS");
    const loadoutListFull = await getLoadoutList(97);
    // const loadoutListMerged = mergeLoadoutInfos(loadoutListFull);
    // console.log(loadoutListMerged)
    // await getLoadoutStats();




    const domContainer = document.querySelector('#matchHistory .right-area');
    const root = ReactDOM.createRoot(domContainer);
    const rateProps = { picks: 10, totalPicks: 20, matches: 4, totalMatches: 5, wins: 7 };
    const el = React.createElement(ShipLoadoutInfoList, { loadoutInfos: loadoutListFull })
    root.render(el);
}

setTimeout(start, 400);
// start();
// console.log(el)
// el.setState({shipModel: 14});

