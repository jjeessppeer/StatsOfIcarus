import '/js/MatchHistory/elements/FancySearch.js';
import '/js/MatchHistory/elements/ShipPopularity.js';
import '/js/MatchHistory/elements/PlayerShipInfo.js';
import '/js/MatchHistory/elements/PlayerInfo.js';
import '/js/MatchHistory/elements/EloCard.js';
import '/js/MatchHistory/elements/LeaderboardCard.js';

import { SKILL_ORDER, ship_image_srcs2, game_modes, SHIP_ITEMS, CLASS_COLORS, ship_scales, ship_offsets } from '/js/constants.js';
import { ShipLoadoutInfoList } from '/React/ShipStats/LoadoutInfoList.js';
import { mergeLoadoutInfos, mapLoadoutId, mergeMatchupStats } from '/React/ShipStats/LoadoutUtils.js';
import { MatchHistoryList } from '/React/MatchHistory/MatchHistoryList.js';

const DEFAULT_QUERY = {
    perspective: {type: "Overview", name: ""},
    filters: []
};

var current_match_filters = [];

function initializeMatchHistory(){
    let searchbar = document.createElement('div', { is: 'fancy-searchbar' });
    document.getElementById('matchHistorySearch').append(searchbar);
    searchbar.addEventListener('search', evt => executeSearch(evt.detail));

    searchbar.querySelector('.filter-button').addEventListener('click', evt => {
        let search = evt.target.parentElement.parentElement;
        search.classList.toggle('filters-open');
    });

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('search')) {
        const compressed = urlParams.get('search');
        const decoded = LZString.decompressFromEncodedURIComponent(compressed);
        const parsedQuery = JSON.parse(decoded);
        executeSearch(parsedQuery);   
    }
    else {
        executeSearch(DEFAULT_QUERY);
    }
}

async function executeSearch(query) {
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

    const resposeQuery = response.modifiedQuery;
    if (window.location.hash == "#matchHistory"){
        const queryString = JSON.stringify(response.originalQuery)
        const encoded = LZString.compressToEncodedURIComponent(queryString);
        const urlParams = new URLSearchParams();
        urlParams.set('search', encoded);
        updateQueryParams(urlParams);
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
    initializePopularityList(response.shipsWinrates);

    const rootDiv = document.querySelector('#matchHistory .right-area');
    if (reactRoot == undefined) reactRoot = ReactDOM.createRoot(rootDiv);

    // const root = ReactDOM.createRoot(domContainer);
    const el = React.createElement(ShipLoadoutInfoList, { loadoutInfos: loadoutListFull })
    reactRoot.render(el);
    initializePopularityList(response.shipsWinrates);
    return response;
}

async function executeHistoryQuery(query) {
    const responseRaw = await fetch('/match_history_search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)});
    const response = await responseRaw.json();

    current_match_filters = response.modifiedQuery.filters;

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
    if (mlReactRoot != undefined) mlReactRoot.unmount();
    reactRoot = undefined;
    mlReactRoot = undefined;
    
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

let mlReactRoot = undefined;
function intializeMatchHistoryList(matches, matchCount=0) {
    const domRoot = document.querySelector("#matchHistory .right-area");
    mlReactRoot = ReactDOM.createRoot(domRoot);
    const el = React.createElement(
        MatchHistoryList, 
        { matches: matches, searchFilters: current_match_filters }
    );
    mlReactRoot.render(el);
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



// storm_gundeck_small
// pyra_gundeck_small
// magnate_gundeck_small






initializeMatchHistory();