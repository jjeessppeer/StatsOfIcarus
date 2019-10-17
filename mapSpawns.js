

function initializeSpawns(){
    if (!map_dataset) {
        console.log("Still loading");
        setTimeout(function(){ initializeSpawns(); }, 1000);
        return;
    }

    let rows = map_dataset.getDatasetRows();
    for (let i=0; i < rows.length; i++){
        $("#spawnMapSelect").append("<option>" + rows[i][1] + "</option>");
    }

    $("#spawnMapSelect").on("change", updateSpawnMap);
    updateSpawnMap();
}


function updateSpawnMap(){
    if (!map_dataset) {
        console.log("Still loading");
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