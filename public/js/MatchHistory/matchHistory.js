
var search_mode = 0;

var pickwinrateChart;

const SKILL_ORDER = [
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
]

function initializeMatchHistory(){
    // Initialize search categories
    document.querySelectorAll(".match-history-search .category-button > button").forEach(element => {
        element.addEventListener("click", evt => {
            // Hide other search categories.
            document.querySelectorAll(".category-content").forEach(el => {
                el.style.height = "0px";
            });
            let category = evt.target.parentElement.parentElement;
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
    document.querySelector(".basic-search button").addEventListener("click", requestRecentMatches);
    document.querySelector(".basic-search input").addEventListener("keydown", evt => {
        if (evt.keyCode === 13) {
            evt.preventDefault();
            requestRecentMatches();
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

    httpxPostRequest('/get_ship_winrates', {}, function() {
        if (this.readyState == 4 && this.status == 200){
            let response = JSON.parse(this.response);
            if (!response) return;
            console.log(response);
            // updateMatchHistoryList(response); 
            // redrawWinpickChart(response.modelWinrates, response.count);
            updatePopularityList(response.ModelWinrates, response.Count);
        }
    });
    

    // initializeCharts();
    requestRecentMatches();

    httpxPostRequest('/get_player_info', {name: "whereami"}, function() {
        if (this.readyState == 4 && this.status == 200){
            let response = JSON.parse(this.response);
            if (!response) return;
            console.log(response);
        }
    });
}

function initializeCharts() {
    const ctx = document.getElementById('winpickChart');

    let options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                title: {
                    display: true,
                    text: 'Win rate'
                },
                align: "end",
                min: 0,
                ticks: {
                    callback: function (value) {
                      return `${value*100}%`;
                    },
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Pick rate'
                },
                min: 0,
                ticks: {
                    callback: function (value) {
                      return `${value*100}%`;
                    },
                }
            }
        },
        layout: {
            padding: 10
        },
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: "Ship win rate and popularity",
                padding: {
                    bottom: 20
                }
            },
            tooltip: {
                usePointStyle: false,
                callbacks: {
                    title: function(context) {
                        let title = [];
                        context.forEach(element => {
                            title.push(element.chart.data.labels[element.dataIndex])
                        });
                        return title.join(", ");
                    },
                    label: function(context){
                        let datapoint = context.dataset.data[context.dataIndex];
                        let pickPercentage = precise(context.raw.x*100, 2);
                        let winPercentage = precise(context.raw.y*100, 2);
                        return [`Wins:   ${winPercentage}% [${context.raw.picks}]`,`Picked:\t${pickPercentage}% [${context.raw.wins}]`];
                    }
                }
            },
            datalabels: {
                display: 'auto',
                align: 'end',
                offset: function (context) {
                    return -40
                },
                color: function(value, context){
                    return 'black';
                },
                font: function(context){
                    return {size: 14, lineHeight: context.dataset.data[context.dataIndex].r == 18 ? 3.2 : 2.6};
                },
                // font: {size: 14, lineHeight: 2.5},
                formatter: function(value, context) {
                    return context.chart.data.labels[context.dataIndex] + "\n";
                }
            }
        }
    };
    pickwinrateChart = new Chart(ctx, {
        type: 'bubble',
        data: {},
        options: options
    });
}


function updatePopularityList(modelWinrates, totalMatches) {
    modelWinrates.sort(function (a, b) {
        return b.PlayedGames - a.PlayedGames;
    });
    document.getElementById('ShipPopularityList').innerHTML = "";
    modelWinrates.forEach(ship => {
        let li = document.createElement('li', {is: 'ship-popularity-element'});
        li.initialize(ship, totalMatches);
        document.getElementById('ShipPopularityList').append(li)
    });
}

function redrawWinpickChart(modelWinrates, totalMatches) {
    removeChartData(pickwinrateChart);
    let percentageMode = true;

    let labels = [];
    let dataset = [];
    let totalPicks = totalMatches * 4;
    modelWinrates.forEach(el => {
        labels.push(el.ShipItem[0].Name);
        dataset.push({x: el.PlayedGames / totalPicks, y: el.Wins / el.PlayedGames, r: 12, picks: el.PlayedGames, wins: el.Wins});
    });

    let data = {
        labels: labels,
        datasets: [{
            label: "Scatterdata",
            data: dataset
        }]
    }
    pickwinrateChart.data = data;
    pickwinrateChart.update();
    console.log("UPDATING CHART");
}

function getMatchFilters() {
    let filters = [];
    if (search_mode == 0) {
        let searchString = document.querySelector(".basic-search input").value;
        let searchType = document.querySelector(".basic-search select").value;

        if (searchType == "All" || searchString == ""){
            return filters;
        }
        filters.push({
            filterType: searchType, 
            data: searchString});
    }
    return filters;
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
            // redrawWinpickChart(response.modelWinrates, response.count);
            // updatePopularityList(response.modelWinrates, response.count);
        }
    });
}
function updateMatchHistoryList(matchHistory){
    console.log("Match history recieved");
    console.log(matchHistory);

    // Insert new match history elements from the input list.
    for (let entry of matchHistory.Matches) {
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

function getSkillItem(matchRecord, skillId) {
    for (let skill of matchRecord.SkillItems) {
        if (skill._id == skillId) return skill;
    }
    throw "No skill with specified id found";
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