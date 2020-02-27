

function initializeSpawns(){
    if (!map_dataset) {
        console.log("Still loading");
        setTimeout(function(){ initializeSpawns(); }, 1000);
        return;
    }
    let rows = map_dataset.filterByString("2v2", "Game mode").getDatasetRows();
    for (let i=0; i < rows.length; i++){
        $("#spawnMapSelect").append("<option>" + rows[i][1] + "</option>");
    }

    $("#spawnMapSelect").on("change", updateSpawnMap);
    $("#randomMapButton").on("click", randomizeMap);
    updateSpawnMap();
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