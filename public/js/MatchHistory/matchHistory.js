
var search_mode = 0;



function initializeMatchHistory(){
    // Initialize search categories
    document.querySelectorAll(".match-history-search .category-button > button").forEach(element => {
        element.addEventListener("click", evt => {
            // Hide other search categories.
            document.querySelectorAll(".category-content").forEach(el => {
                el.style.height = "0px";
            });
            let category = evt.originalTarget.parentElement.parentElement;
            // Show this one
            let target = category.querySelector(".category-content")
            target.style.height = target.scrollHeight+"px";

            const index = Array.from(category.parentNode.children).indexOf((category))
            search_mode = index;
        });
    });

    let basicCat = document.querySelector("#basicSearchCategory .category-content");
    let advanCat = document.querySelector("#advancedSearchCategory .category-content");
    basicCat.style.height = basicCat.scrollHeight+"px";
    advanCat.style.height = "0px";

    // Initialize basic search
    document.querySelector(".basic-search button").addEventListener("click", requestFilteredSearch);
    document.querySelector(".basic-search input").addEventListener("keydown", evt => {
        if (evt.keyCode === 13) {
            evt.preventDefault();
            requestFilteredSearch();
        }
    });
    document.querySelector(".basic-search select").addEventListener("change", evt => {
        let textInput = document.querySelector(".basic-search input");
        textInput.disabled = false;
        if (evt.target.value == "Player") textInput.placeholder = "Player name..."
        if (evt.target.value == "Ship") textInput.placeholder = "Ship name..."

        if (evt.target.value == "All") {
            textInput.disabled = true;
            // textInput.placeholder = "";
        }
    });

    requestMatchListUpdate(); 
}

function getSearchOptions() {
    let options = {
        filters: [], 
        perspective: "All", 
        offset: 0,
        count: 10};

    if (search_mode == 0) {
        let searchString = document.querySelector(".basic-search input").value;
        let searchType = document.querySelector(".basic-search select").value;

        if (searchType == "All" || searchString == ""){
            return options;
        } 
        options.perspective = searchType;
        options.filters.push( {
            filterType: searchType, 
            data: searchString} );
    }
    return options;
}

function requestFilteredSearch() {
    let options = getSearchOptions();
    document.getElementById("matchHistoryList").innerHTML = "";
    httpxPostRequest('/get_match_history2', options, function() {
        if (this.readyState == 4 && this.status == 200){
            let response = JSON.parse(this.response);
            updateMatchHistoryList(response); 
        }
    });
}

function requestMatchListUpdate(){
    console.log("Requesting match history update");

    // Clear old table.
    document.getElementById("matchHistoryList").innerHTML = "";

    // Parse filters
    // TODO
    let filters = [];
    let offset = 0;
    let count = 10;

    let requestData = {filters: filters, offset: offset, count: count};

    // Request new data
    httpxPostRequest('/get_match_history2', requestData, function() {
        if (this.readyState == 4 && this.status == 200){
            let response = JSON.parse(this.response);
            updateMatchHistoryList(response); 
        }
    });
}

function updateMatchHistoryList(matchHistory){
    console.log("Match history recieved");
    console.log(matchHistory);

    // Insert new match history elements from the input list.
    for (let entry of matchHistory.data) {
        let overview = document.createElement('li', {is: 'match-history-entry'});
        overview.fillData(entry);
        document.getElementById("matchHistoryList").append(overview); 
        console.log("added entry") 
    }
    
}

// TODO: Make these functions fetch and cache data instead of resending with every match record.

function getShipLoadout(matchRecord, shipLoadoutId) {
    for (let ship of matchRecord.ShipLoadouts) {
        if (ship._id == shipLoadoutId) return ship;
    }
    throw "No ship with specified id found";
}

function getPlayerInfo(matchRecord, playerId) {
    for (let player of matchRecord.PlayerInfo) {
        if (player._id == playerId) {
            return player;
        }
    }
    console.log("No player " + playerId);
    console.log(matchRecord);
    throw "No player with specified id found " + playerId;
}

function getLoadoutInfo(matchRecord, loadoutId) {
    for (let loadout of matchRecord.LoadoutInfo) {
        if (loadout._id == loadoutId) return loadout;
    }
    throw "No loadout with specified id found";
}

function getGunItem(matchRecord, gunId) {
    for (let gun of matchRecord.GunItems) {
        if (gun._id == gunId) return gun;
    }
    console.log(matchRecord);
    throw `No gun with specified id found: ${gunId}`;
}

function getShipItem(matchRecord, shipId) {
    for (let ship of matchRecord.ShipItems) {
        if (ship._id == shipId) return ship;
    }
    throw "No ship item with specified id found: " + shipId;
}


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

function toShipImageCoordinates(point, shipModel, shipImage) {
    return [
        point[0] * ship_scales[shipModel] + shipImage.width / 2, 
        point[1] * -ship_scales[shipModel] + ship_offsets[shipModel]]
}

function spreadGunPositions(gunPositions, iconSize, iterations=10) {
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