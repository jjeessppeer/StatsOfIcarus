

function initializeSpawns(){
    if (!map_dataset) {
        console.log("Still loading");
        setTimeout(function(){ initializeSpawns(); }, 1000);
        return;
    }
    let rows = map_dataset.filterByString("Deathmatch", "Mode").filterByString("2", "Size").getDatasetRows();
    for (let i=0; i < rows.length; i++){
        $("#spawnMapSelect").append("<option>" + rows[i][1] + "</option>");
    }

    $("#spawnMapSelect").on("change", updateSpawnMap);
    $("#randomMapButton").on("click", randomizeMap);
    updateSpawnMap();
    initializeTournamentRandomizer();

}

function initializeTournamentRandomizer(){
    
    $("#tournamentMapPool > div > input").on("change", function(){
        let checkboxes = $("#tournamentMapPool > div > input");
        let checks = [];
        for (let i=0; i<checkboxes.length; i++){
            checks.push((checkboxes[i].checked ? 1 : 0));
        }
        setCookie("mapPoolChecks", JSON.stringify(checks));
    });
    $("#generateMapSetBtn").on("click", generateMapSet);
    $("#mapModes > div > input, #mapSizes > div > input").on("change", loadMapPool);

    // // Initialize checkboxes.
    // let pool_config = getCookie("poolConfig");
    // if (!pool_config){
    //     pool_config = []
    //     pool_config.length = 6 + 4 + 47;
    //     pool_config.fill(1);
    //     pool_config[6] = 0;
    //     pool_config[7] = 1;
    //     pool_config[8] = 0;
    //     pool_config[9] = 0;
    //     setCookie("poolConfig", JSON.stringify(pool_config));
    // }

    loadMapPool();
}

function loadMapPool(){
    // let size = ;
    // let pool_config = []
    // pool_config.length = 6 + 4 + 47;
    // pool_config.fill(1);
    // console.log(pool_config);
    // console.log(JSON.stringify(pool_config));


    let modes = [];
    let modeChecks = $("#mapModes > div");
    for (let i=0; i<modeChecks.length; i++){
        if (modeChecks[i].childNodes[1].checked) modes.push(modeChecks[i].childNodes[3].innerText);
    }

    let size;
    let sizeChecks = $("#mapSizes > div");
    for (let i=0; i<sizeChecks.length; i++){
        if (sizeChecks[i].childNodes[1].checked) size = sizeChecks[i].childNodes[3].innerText;
    }
    


    let maps = map_dataset.filterByString(size, "Size").filterByStringArray(modes, "Mode", false, false, true).getDatasetRows();
    $("#tournamentMapPool").empty();
    if (maps.length == 0) $("#tournamentMapPool").append("No maps matching all filters.")
    for (let i=0; i < maps.length; i++){
        // Initialize tournament ranzomizer options
        $("#tournamentMapPool").append(`
            <div class="form-check" style="display: inline-block;width:190px;">
            <input type="checkbox" class="form-check-input" id="map-pool-`+i+`" autocomplete="off" checked>
            <label class="form-check-label" for="map-pool-`+i+`">`+maps[i][1]+`</label>
            </div>`);
    }
}

function generateMapSet(){
    let selections = $("#tournamentMapPool > div");
    let map_pool = [];
    for (let i=0; i<selections.length; i++){
        // console.log(selections[i].childNodes[1].checked, ", ", selections[i].childNodes[3].innerText);
        if (selections[i].childNodes[1].checked)
            map_pool.push(selections[i].childNodes[3].innerText);
    }

    let n_maps = Number($("#mapSetSize").val());
    if (!n_maps) n_maps = 0;
    if (n_maps > map_pool.length){
        alert("Error: Set size larger than selected map pool.")
        return;
    }
    $("#tournamentMapSet").empty();
    for (let i=0; i<n_maps; i++){
        let r = Math.floor(Math.random() * (map_pool.length));
        $("#tournamentMapSet").append((i==0 ? "" : "<br>") + (i+1) + ". " + map_pool[r]);
        map_pool.splice(r, 1);
    }
}

function updateSpawnMap(){
    if (!map_dataset) {
        setTimeout(function(){ updateSpawnMap(); }, 1000);
        return;
    }

    let map_name = $("#spawnMapSelect").val();
    let image_src = map_dataset.filterByString("Deathmatch", "Mode").getCellByString(map_name, "Name", "Spawn Image");
    if (image_src)
        $("#spawnImage").attr("src", image_src);
    else
        $("#spawnImage").attr("src", "404.jpg");
}

function randomizeMap(){
    let options = [];
    $("#spawnMapSelect option").each(function()
    {
        options.push($(this).val());
    });

    let rand_n = Math.floor(Math.random() * map_dataset.filterByString("2v2", "Game mode").getNOfRows());
    $("#spawnMapSelect").val(options[rand_n]);
    updateSpawnMap();
}