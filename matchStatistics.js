

//Make generic funtion to get winrate of ships in list vs ships in other list
// ["Pyramidion", "Judgement"] vs ["Judgement", "all"]


var prDoughnut;
var wlDoughnut;
var enemyRadar;
var allyRadar;

function initializeMatchStatistics(){
    $("#statsShipSelect").on("change", function(){
        console.log("Changarro")
        updateStatsPanel($(this).val());
    });
    updateStatsPanel($("#statsShipSelect").val());
}


function n_in(row, ship_name, team) {

    if (ship_name == "all") return 2;
    let count = 0;
    if (team == 1) {
        if (row[5].includes(ship_name)) count++;
        if (row[6].includes(ship_name)) count++;
    }
    if (team == 2) {
        if (row[7].includes(ship_name)) count++;
        if (row[8].includes(ship_name)) count++;
    }
    return count;
}

function calcWinsTeam(data_rows, active_ship, team, enemy_ship = "all", ally_ship = "all", exlude_mirrors = false) {

    let wins = 0;
    let losses = 0;

    for (var i = 0; i < data_rows.length; i++) {
        let t1_score = data_rows[i][3];
        let t2_score = data_rows[i][4];

        let n_active = n_in(data_rows[i], active_ship, team);
        let n_ally = n_in(data_rows[i], ally_ship, team);
        let n_enemy = n_in(data_rows[i], enemy_ship, team == 1 ? 2 : 1);

        if (n_active == 0) continue;
        if (n_enemy == 0) continue;
        if (n_ally == 0) continue;
        if (active_ship == ally_ship && n_ally < 2) continue;
        if (exlude_mirrors && (n_in(data_rows[i], active_ship, team == 1 ? 2 : 1) != 0)) continue;

        if ((t1_score > t2_score && team == 1) || (t1_score < t2_score && team == 2))
            wins += 1;
        else if ((t1_score < t2_score && team == 1) || (t1_score > t2_score && team == 2))
            losses += 1;
    }
    return [wins, losses];
}

function calcWins(data_rows, active_ship, enemy_ship = "all", ally_ship = "all") {
    let [w1, l1] = calcWinsTeam(data_rows, active_ship, 1, enemy_ship, ally_ship, false);
    let [w2, l2] = calcWinsTeam(data_rows, active_ship, 2, enemy_ship, ally_ship, false);

    return [w1 + w2, l1 + l2];
}

function pickRateShip(data_rows, active_ship) {
    let count = 0;
    let total = 0;
    for (var i = 0; i < data_rows.length; i++) {
        count += n_in(data_rows[i], active_ship, 1);
        count += n_in(data_rows[i], active_ship, 2);
        total += 4;
    }
    return [count, total];
}

function pickRateTeam(data_rows, active_ship) {
    let count = 0;
    let total = 0;
    for (var i = 0; i < data_rows.length; i++) {
        let n = 0;
        if (n_in(data_rows[i], active_ship, 1) != 0) count += 1;
        if (n_in(data_rows[i], active_ship, 2) != 0) count += 1;
        total += 2;
    }
    return [count, total];
}

function updateStatsPanel(active_ship) {
    if (!(match_dataset)) {
        console.log("Still loading");
        setTimeout(function () { updateStatsPanel(active_ship); }, 1000);
        return;
    }

    let data_rows = match_dataset.filterByStringMultiCol(active_ship, ["T1 Ship 1", "T1 Ship 2", "T2 Ship 1", "T2 Ship 2"]).getDatasetRows();
    //let n_matches = data_rows.getNOfRows();

    let [wins, losses] = calcWins(data_rows, active_ship);

    // Get enemy win data.
    let win_vs_ratios = [];
    let win_vs_ships = [];
    for (var i = 0; i < SHIP_LIST.length; i++) {
        let [w, l] = calcWins(data_rows, active_ship, SHIP_LIST[i], "all");
        let total = w + l;
        if (total == 0) continue;
        win_vs_ratios.push(w / total);
        win_vs_ships.push(SHIP_LIST[i] + " [" + total + "]");
    }

    // Get ally win data.
    let win_ally_ratios = [];
    let win_ally_ships = [];
    for (var i = 0; i < SHIP_LIST.length; i++) {
        let [w, l] = calcWins(data_rows, active_ship, "all", SHIP_LIST[i]);
        let total = w + l;
        if (total == 0) continue;
        win_ally_ratios.push(w / total);
        win_ally_ships.push(SHIP_LIST[i] + " [" + total + "]");
    }

    
    // Get pick rate data.
    let pick_data=[];
    for (var i = 0; i < SHIP_LIST.length; i++) {
        let [picks, total] = pickRateShip(match_dataset.getDatasetRows(), SHIP_LIST[i]);
        if (picks == 0) continue;
        pick_data.push({label: SHIP_LIST[i], data: picks, color: SHIP_LIST[i] == active_ship ? "rgb(100, 100, 250)" : "rgb(100, 100, 100)"});
    }
    pick_data.sort(function(a, b){return b.data>a.data;});
    let pick_rates = [];
    let pick_labels = [];
    let pick_colors = [];
    pick_data.forEach(function(d){
        pick_rates.push(d.data);
        pick_labels.push(d.label);
        pick_colors.push(d.color);
    });

    // Setup charts
    updateCharts(
        wins, losses, 
        [pick_rates, pick_labels, pick_colors],
        [win_vs_ratios, win_vs_ships],
        [win_ally_ratios, win_ally_ships]);
}


function updateCharts(wins, losses, pick_data, enemy_data, ally_data){

    // Pick rate pie chart
    var ctx_pr = document.getElementById('prChart').getContext('2d');
    let [pick_rates, pick_labels, pick_colors] = pick_data;
    if (!prDoughnut){
        prDoughnut = new Chart(ctx_pr, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: pick_rates,
                    backgroundColor: pick_colors,
                    label: 'Dataset 1'
                }],
                labels: pick_labels
            },
            options: {
                responsive: false,
                legend: {
                    display: false,
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Pick rate per team'
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                tooltips: {
                    callbacks: {
                        title: function(tooltipItem, data) {
                            return data.labels[tooltipItem[0].index];
                        },
                        label: function(tooltipItem, data){
                            let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            let total = 0;
                            data.datasets[tooltipItem.datasetIndex].data.forEach(function(d){
                                total += d;
                            });
                            return value + " [" + precise(100*value/total, 3) + "%]";
                        }
                    }   
                }
            }
        }
        );
    }
    else{
        prDoughnut.data.datasets[0].backgroundColor = pick_colors;
        prDoughnut.data.datasets[0].data = pick_rates;
        prDoughnut.data.labels = pick_labels;
        prDoughnut.update();
    }

    
    // Win-loss pie chart
    var ctx_wl = document.getElementById('wlChart').getContext('2d');
    if (!wlDoughnut){
        wlDoughnut = new Chart(ctx_wl, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [
                        losses,
                        wins
                    ],
                    backgroundColor: [
                        'rgb(220, 99, 132)',
                        'rgb(99, 200, 132)'
                    ],
                    label: 'Dataset 1'
                }],
                labels: [
                    'Losses',
                    'Wins'
                ]
            },
            options: {
                responsive: false,
                legend: {
                    display: false,
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Wins/Losses'
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                tooltips: {
                    callbacks: {
                        title: function(tooltipItem, data) {
                            return data.labels[tooltipItem[0].index];
                        },
                        label: function(tooltipItem, data){
                            let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            let total = 0;
                            data.datasets[tooltipItem.datasetIndex].data.forEach(function(d){
                                total += d;
                            });
                            return value + " [" + precise(100*value/total, 3) + "%]";
                        }
                    }   
                }
            }
        }
        );
    }
    else{
        //wlDoughnut.data.datasets[0].backgroundColor = pick_colors;
        wlDoughnut.data.datasets[0].data = [losses, wins];
        //wlDoughnut.data.labels = pick_labels;
        wlDoughnut.update();
    }

    // Radar charts

    
    var ctx_vs = document.getElementById('winRatioEnemyChart').getContext('2d');
    let [win_vs_ratios, win_vs_ships] = enemy_data;
    if (!enemyRadar){
        enemyRadar = new Chart(ctx_vs, {
            type: 'radar',
            data: {
                labels: win_vs_ships,
                datasets: [{
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    data: win_vs_ratios,
                    lineTension: 0.1
                }],
    
            },
            options: {
                responsive: false,
                scale: {
                    display: true
                },
                legend: {
                    display: false,
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Win ratio against  ships'
                },
                tooltips: {
                    callbacks: {
                        title: function(tooltipItem, data) {
                            let value = "";
                            tooltipItem.forEach(function(item){
                                value += data.labels[item.index] + "\n";
                            });
                            value = value.replace(/\n$/, "");
                            return value;
                        },
                        label: function(tooltipItem, data){
                            let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            return precise(100*value, 3) + "%";
                        }
                    }   
                }
            }
        });
    }
    else{
        enemyRadar.data.datasets[0].data = win_vs_ratios;
        enemyRadar.data.labels = win_vs_ships;
        enemyRadar.update();
    }
    

    var ctx_ally = document.getElementById('winRatioAllyChart').getContext('2d');
    let [win_ally_ratios, win_ally_ships] = ally_data;
    if (!allyRadar){
        allyRadar = new Chart(ctx_ally, {
            type: 'radar',
            data: {
                labels: win_ally_ships,
                datasets: [{
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    data: win_ally_ratios,
                    lineTension: 0.1
                }],
            },
            options: {
                responsive: false,
                scale: {
                    display: true
                },
                legend: {
                    display: false,
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Win rate with ally ship'
                },
                tooltips: {
                    callbacks: {
                        title: function(tooltipItem, data) {
                            let value = "";
                            tooltipItem.forEach(function(item){
                                value += data.labels[item.index] + "\n";
                            });
                            value = value.replace(/\n$/, "");
                            return value;
                        },
                        label: function(tooltipItem, data){
                            let value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                            return precise(100*value, 3) + "%";
                        }
                    }   
                }
            }
        });
    }
    else {
        allyRadar.data.datasets[0].data = win_ally_ratios;
        allyRadar.data.labels = win_ally_ships;
        allyRadar.update();
    }
}