
function initializeRandomMap(){

    $("#randomMapButton").on("click", randomizeMap);

    //randomizeMap();
}

function randomizeMap(){
    if (!map_dataset) {
        console.log("Still loading");
        setTimeout(function(){ randomizeMap(); }, 1000);
        return;
    }
    let rand_n = Math.floor(Math.random() * map_dataset.getNOfRows());

    let data = map_dataset.getDatasetRow(rand_n);

    $("#randomMapTitle").text(data[1]);
    $("#randomMapModes").text(data[2]);

    if (data.length > 4){
        console.log("Map available");
        $("#randomMapPreview").attr("src", data[4]);
        $("#randomMapPreviewText").hide();
        $("#randomMapPreview").show();
    }
    else {
        $("#randomMapPreview").attr("src", "");
        $("#randomMapPreviewText").show();
        $("#randomMapPreview").hide();
    }
}
