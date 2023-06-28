import '/js/MatchHistory/elements/FancySearch.js';
import '/js/MatchHistory/elements/MatchHistoryList.js';
import '/js/MatchHistory/elements/ShipPopularity.js';
import '/js/MatchHistory/elements/PlayerShipInfo.js';
import '/js/MatchHistory/elements/PlayerInfo.js';
import '/js/MatchHistory/elements/EloCard.js';
import '/js/MatchHistory/elements/LeaderboardCard.js';

import { ShipLoadoutInfoList } from '/React/ShipStats/LoadoutInfo.js';
import { mergeLoadoutInfos, mapLoadoutId, mergeMatchupStats } from '/React/ShipStats/LoadoutUtils.js';

export const SKILL_ORDER = [
    "Rubber Mallet",
    "Fail-safe Kit",
    "Pipe Wrench",
    "Shifting Spanner",
    "Fire Extinguisher",
    "Chemical Spray",
    "DynaBuff Industries Kit",
    "Armor Kit",

    "Charged Rounds",
    "Burst Rounds",
    "Greased Rounds",
    "Lesmok Rounds",
    "Lochnagar Shot",
    "Heavy Clip",
    "Incendiary Rounds",
    "Heatsink Clip",
    "Extended Magazine",

    "Spyglass",
    "Range-Finder",
    "Phoenix Claw",
    "Kerosene",
    "Moonshine",
    "Drift Sail",
    "Hydrogen Canister",
    "Balloon Vent",
    "Drogue Chute",
    "Impact Bumpers",
    "Tar Barrel"
];

export const ship_image_srcs2 = {
    70: "images/ship-images/corsair_gundeck_small.png",
    67: "images/ship-images/crusader_gundeck_small.png",
    14: "images/ship-images/galleon_gundeck_small.png",
    11: "images/ship-images/goldfish_gundeck_small.png",
    69: "images/ship-images/judge_gundeck_small.png",
    12: "images/ship-images/junker_gundeck_small.png",
    64: "images/ship-images/magnate_gundeck_small.png",
    19: "images/ship-images/mob_gundeck_small.png",
    16: "images/ship-images/pyra_gundeck_small.png",
    82: "images/ship-images/shrike_gundeck_small.png",
    15: "images/ship-images/spire_gundeck_small.png",
    13: "images/ship-images/squid_gundeck_small.png",
    97: "images/ship-images/storm_gundeck_small.png" 
};

export const game_modes = {
    2: "Deathmatch"
}

export const SHIP_ITEMS = {
    11: {Name: "Goldfish", Id: 11},
    12: {Name: "Junker", Id: 12},
    13: {Name: "Squid", Id: 13},
    14: {Name: "Galleon", Id: 14},
    15: {Name: "Spire", Id: 15},
    16: {Name: "Pyramidion", Id: 16},
    19: {Name: "Mobula", Id: 19},
    64: {Name: "Magnate", Id: 64},
    67: {Name: "Crusader", Id: 67},
    69: {Name: "Judgement", Id: 69},
    70: {Name: "Corsair", Id: 70},
    82: {Name: "Shrike", Id: 82},
    97: {Name: "Stormbreaker", Id: 97},
}

export const CLASS_COLORS = {
    "Pilot": 'rgb(85, 135, 170)',
    "Gunner": 'rgb(167, 76, 18)',
    "Engineer": 'rgb(189, 137, 45)'
}

const DEFAULT_QUERY = {
    perspective: {type: "Overview", name: ""},
    filters: []
};

function initializeMatchHistory(){
    let searchbar = document.createElement('div', { is: 'fancy-searchbar' });
    document.getElementById('matchHistorySearch').append(searchbar);
    searchbar.addEventListener('search', evt => executeSearch(evt.detail));

    searchbar.querySelector('.filter-button').addEventListener('click', evt => {
        let search = evt.target.parentElement.parentElement;
        search.classList.toggle('filters-open');
    });

    let urlQuery = getUrlQuery();
    if (urlQuery != undefined) {
        executeSearch(urlQuery);
    }
    else {
        executeSearch(DEFAULT_QUERY);
    }
}

function getUrlQuery() {
    let urlparams = getUrlParam();
    if (!urlparams) return undefined;
    let query = JSON.parse(decodeURIComponent(urlparams));
    return query;
}

var current_match_page = 0;
var current_match_filters = [];
async function requestNextMatchHistoryPage(evt) {
    evt.target.disabled = true;
    current_match_page += 1;

    let response = await fetch('/request_matches', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({page: current_match_page, filters: current_match_filters})
    });
    let json = await response.json();
    document.querySelector('#matchHistory .match-history-list').addMatches(json.Matches);
    evt.target.disabled = false;
}

async function executeSearch(query) {
    console.log("SEARCH__");
    console.log(query);
    // Clear old graphics
    clearMatchHistoryDisplay();
    const perspective = query.perspective.type;
    let response;
    if (perspective == 'Overview' || perspective == 'Player') {
        response = await executeHistoryQuery(query);
    }
    if (perspective == 'Ship') {
        response = await executeShipQuery(query);
    }
    console.log("__RESPONSE__")
    console.log(response);

    const resposeQuery = response.modifiedQuery;
    let encodedQuery = encodeURIComponent(JSON.stringify(response.originalQuery));
    if (window.location.hash.substring(1).split("?")[0] == "matchHistory"){
        setUrlParam(encodedQuery);
        if (resposeQuery.perspective.type == 'Overview') setUrlParam();
    }

    //Update search field based on recieved data.
    let search = document.querySelector('.fancy-search');
    search.setText(resposeQuery.perspective.name);
    if (resposeQuery.perspective.type == 'Overview'){
        search.setText("");
    }
}

let reactRoot;
async function executeShipQuery(query) {
    const rawRes = await fetch('/ship_loadouts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
    });
    const response = await rawRes.json();
    const loadoutListFull = response.loadoutList;
    // const loadoutListMerged = mergeLoadoutInfos(loadoutListFull);
    // console.log(loadoutListMerged)
    // await getLoadoutStats();

    const rootDiv = document.querySelector('#matchHistory .right-area');
    if (reactRoot == undefined) reactRoot = ReactDOM.createRoot(rootDiv);

    // const root = ReactDOM.createRoot(domContainer);
    const el = React.createElement(ShipLoadoutInfoList, { loadoutInfos: loadoutListFull })
    reactRoot.render(el);
    return response;
}

async function executeHistoryQuery(query) {
    const responseRaw = await fetch('/match_history_search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)});
    const response = await responseRaw.json();

    current_match_filters = response.modifiedQuery.filters;
    console.log(current_match_filters)

    // Update graphics with recieved data
    if (query.perspective.type == "Overview") {
        loadOverviewPerspective(response);
    }
    else if (query.perspective.type == "Player") {
        loadPlayerPerspective(response);
    }
    return response;
}

function loadOverviewPerspective(response) {
    intializeMatchHistoryList(response.matches.Matches);
    initializePopularityList(response.shipWinrates);
}

function loadPlayerPerspective(response) {
    console.log("loading player perpective")
    console.log(response);
    let playerData = response.playerData;
    // Initialize ship rates card
    let t = document.createElement('div', {is: "player-ship-info-table"});
    t.initialize(playerData.Winrates);
    document.querySelector('.top-area').append(t);

    // Initialize player overview card.
    let infobox = document.createElement('div', {is: 'player-info-box'});
    document.querySelector('#matchHistory .left-area').append(infobox);
    infobox.initialize(playerData);

    loadEloCard(playerData.PlayerInfo);
    intializeMatchHistoryList(response.matches.Matches);

}

async function loadEloCard(playerInfo) {
    const eloCard = document.createElement('div', {is: 'elo-card'});
    const leaderboardCard = document.createElement('div', {is: 'leaderboard-card'});
    document.querySelector('#matchHistory .left-area').append(eloCard);
    document.querySelector('#matchHistory .left-area').append(leaderboardCard);
    eloCard.initialize(playerInfo._id, playerInfo.ELOCategories);

    leaderboardCard.setHighlightName(playerInfo.Name);
}



function clearMatchHistoryDisplay() {

    if (reactRoot != undefined) reactRoot.unmount();
    reactRoot = undefined;
    
    current_match_page = 0;
    current_match_filters = [];
    const CLEAR_QUERIES = [
        '.player-ship-info-table',
        '.ship-popularity-list',
        '.match-history-list',
        '.player-infobox',
        '.load-more-matches-button'
    ];
    CLEAR_QUERIES.forEach(q => document.querySelectorAll(q).forEach(el => el.remove()));
}


function intializeMatchHistoryList(matches, matchCount=0) {
    let ul = document.createElement('ul', {is: 'match-history-list'});
    ul.addMatches(matches);
    document.querySelector("#matchHistory .right-area").prepend(ul);

    const loadModeBtn = document.createElement('button', {is: 'load-more-matches-button'});
    loadModeBtn.addEventListener('click', requestNextMatchHistoryPage)
    document.querySelector("#matchHistory .right-area").append(loadModeBtn);
}

function initializePopularityList(shipRateData) {
    let modelWinrates = shipRateData.ModelWinrates;
    let totalMatches = shipRateData.Count;
    modelWinrates.sort(function (a, b) {
        return b.PlayedGames - a.PlayedGames;
    });
    document.querySelectorAll('.ship-popularity-list').forEach(el => el.remove());

    let ul = document.createElement('ul', {is: 'ship-popularity-list'});
    ul.initialize(modelWinrates, totalMatches);
    document.querySelector('#matchHistory .left-area').append(ul);
}

function requestRecentMatches(page=0, clearMatchList=true) {
    let filters = getMatchFilters();
    if (clearMatchList) {
        document.getElementById("matchHistoryList").innerHTML = "";
    }
    httpxPostRequest('/get_recent_matches', {filters: filters, pageNumber: page}, function() {
        if (this.readyState == 4 && this.status == 200){
            let response = JSON.parse(this.response);
            if (!response) return;
            updateMatchHistoryList(response); 
        }
    });
}
function updateMatchHistoryList(matchHistory){
    // Insert new match history elements from the input list.
    for (let entry of matchHistory.Matches) {
        let overview = document.createElement('li', {is: 'match-history-entry'});
        overview.fillData(entry);
        document.getElementById("matchHistoryList").append(overview); 
    }
}

// TODO: Make these functions fetch and cache data instead of resending with every match record.




var ship_scales = {
    15: 10.6,
    69: 10.6,
    19: 10.6,
    11: 10.6,
    70: 10.6,
    14: 10.6,
    13: 10.6,
    64: 8.6,
    82: 10.6,
    12: 10.6,
    67: 10.6,
    16: 10.6,
    97: 10.5
}
var ship_offsets = {
    15: 305,
    69: 380,
    19: 160,
    11: 640,
    70: 280,
    14: 410,
    13: 295,
    64: 470,
    82: 355,
    12: 340,
    67: 370,
    16: 440,
    97: 370

}

// storm_gundeck_small
// pyra_gundeck_small
// magnate_gundeck_small

export function toShipImageCoordinates(point, shipModel, shipImage) {
    return [
        point[0] * ship_scales[shipModel] + shipImage.width / 2, 
        point[1] * -ship_scales[shipModel] + ship_offsets[shipModel]]
}

export function spreadGunPositions(gunPositions, iconSize, iterations=10) {
    let adjustedPositions = [];
    const movementStrength = 1/10;
    for (let i = 0; i < gunPositions.length; i++) {
        let pos = [
            gunPositions[i][0]+0,
            gunPositions[i][1]+0
        ];
        for (let j = 0; j < gunPositions.length; j++) {
            if (i == j) continue;
            let vector = [
                gunPositions[j][0] - gunPositions[i][0],
                gunPositions[j][1] - gunPositions[i][1]
            ];
            let distSq = vector[0]*vector[0] + vector[1]*vector[1];
            let dist = Math.sqrt(distSq);
            let vectorNorm = [
                vector[0] / dist,
                vector[1] / dist
            ];
            if (dist < iconSize) {
                pos[0] -= vectorNorm[0] * iconSize * movementStrength;
                pos[1] -= vectorNorm[1] * iconSize * movementStrength;
            }
        }
        adjustedPositions.push(pos);
    }
    if (iterations > 1) adjustedPositions = spreadGunPositions(adjustedPositions, iconSize, iterations-1);
    return adjustedPositions;
}


initializeMatchHistory();