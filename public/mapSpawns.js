

function initializeSpawns(){
    if (!map_dataset) {
        console.log("Still loading");
        setTimeout(function(){ initializeSpawns(); }, 1000);
        return;
    }
    let rows = map_dataset.filterByString("2v2", "Game mode").getDatasetRows();
    for (let i=0; i < rows.length; i++){
        $("#spawnMapSelect").append("<option>" + rows[i][1] + "</option>");

        
        // Initialize tournament ranzomizer options
        $("#tournamentMapPool").append(`
            <div class="form-check" style="display: inline-block;width:180px;">
            <input type="checkbox" class="form-check-input" id="pool-`+i+`" autocomplete="off" checked>
            <label class="form-check-label" for="pool-`+i+`">`+rows[i][1]+`</label>
            </div>`);
    }

    $("#spawnMapSelect").on("change", updateSpawnMap);
    $("#randomMapButton").on("click", randomizeMap);
    updateSpawnMap();


    $("#generateMapSetBtn").on("click", generateMapSet);

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
        console.log(map_pool.length);
    }
}

function updateSpawnMap(){
    if (!map_dataset) {
        setTimeout(function(){ updateSpawnMap(); }, 1000);
        return;
    }

    let map_name = $("#spawnMapSelect").val();
    let image_src = map_dataset.getCellByString(map_name, "Full name", "Spawn image src");
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