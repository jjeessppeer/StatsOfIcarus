

async function initializeSpawns(){
    const mapFetch = await fetch("/maps/2/2/2");
    const mapList = await mapFetch.json();
    mapList.sort((a, b) => (a.Name > b.Name));

    const select = document.getElementById("spawnMapSelect");
    for (const mapItem of mapList) {
        const opt = document.createElement('option');
        opt.textContent = mapItem.Name;
        opt.selected = mapItem.Name == "Canyon Ambush";
        opt.value = `2v2DM_${mapItem.Name.replaceAll(" ", "")}.jpg`;
        select.append(opt);
    }
    select.addEventListener('change', evt => {
        console.log(evt.target.value)
        const img = document.getElementById('spawnImage');
        img.src = `/images/spawn-images/${evt.target.value}`;
    });
    
}

initializeSpawns();