import { TournamentGenerator } from "/React/Maps/TournamentGenerator.js";

async function initializeSpawns(){
    const rootDiv = document.querySelector('#mapsReactRoot');
    const reactRoot = ReactDOM.createRoot(rootDiv);
    const el = React.createElement(TournamentGenerator, { });
    reactRoot.render(el);
}

initializeSpawns();

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