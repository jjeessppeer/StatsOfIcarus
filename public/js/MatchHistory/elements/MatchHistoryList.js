class MatchHistoryList extends HTMLUListElement {
  constructor() {
    super();
    this.classList.add('match-history-list');
  }

  addMatches(matches) {
    for (let match of matches) {
      let overview = document.createElement('li', { is: 'match-history-entry' });
      overview.fillData(match);
      this.append(overview);
    }
  }
}

class MatchHistoryEntry extends HTMLLIElement {
  constructor() {
    super();
    this.classList.add("match-history-entry");
    // this.classList.add("open");

    this.innerHTML = ``;
    this.overview = document.createElement('div', { is: 'match-history-overview' });
    this.foldout = document.createElement('div', { is: 'match-history-foldout' });
    this.prepend(this.overview);
    this.append(this.foldout);
  }
  fillData(matchData) {
    this.classList.add(matchData.Winner == 0 ? "red-winner" : "blue-winner"); // Move to top element.
    this.overview.fillData(matchData);
    this.foldout.details.fillData(matchData);
  }

  toggleFoldout() {
    this.classList.toggle("open");
    this.overview.querySelector(".expand-button i").classList.toggle("fa-chevron-down");
    this.overview.querySelector(".expand-button i").classList.toggle("fa-chevron-up");
  }
}

class MatchHistoryFoldout extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add("foldout");
    // <li><button>Gunnery Analysis</button></li>
    // <li><button>Another button</button></li>
    this.innerHTML = `
            <ul>
                <li><button>Overview</button></li>
            </ul>
            <div class="content"></div>`;
    this.details = document.createElement('div', { is: 'match-history-details' });
    this.querySelector(".content").append(this.details);
  }
}

class MatchHistoryDetails extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add("details");
    this.innerHTML = `
            <div></div>
            <div></div>
        `;

    this.ships = [];

  }
  async fillData(matchData) {
    // return;
    for (let t = 0; t < matchData.TeamCount; t++) {
      this.ships.push([]);
      for (let s = 0; s < matchData.TeamSize; s++) {
        let shipcrew = document.createElement('div', { is: 'match-history-shipcrew' });
        shipcrew.fillData(matchData, t, s);
        this.ships[t].push(shipcrew);
        this.querySelector(`:scope > div:nth-child(${t + 1})`).append(shipcrew);

      }
    }
  }
}

class ShipCrew extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add("shipcrew");
    // <span>SHIP NAME</span>
    this.innerHTML = `
            <span>EMPTY SHIP</span>
            <div>
                <canvas height="250" width="250"></canvas>
                <ul>
                <li></li>
                <li></li>
                <li></li>
                <li></li>
                </ul>
            </div>
        `;
    this.transform = [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1];


  }

  async fillData(matchData, teamIdx, shipIdx) {
    // Initialize player list.
    if (matchData.Ships[teamIdx][shipIdx] == undefined) return;

    this.querySelector(":scope > span").textContent = matchData.ShipNames[teamIdx][shipIdx];

    let listElements = this.querySelectorAll("li");
    for (let i = 0; i < 4; i++) {
      let playerId = matchData.Players[teamIdx][shipIdx][i];
      let loadoutId = matchData.Skills[teamIdx][shipIdx][i];
      // console.log("Getting player info " + teamIdx + ", " + shipIdx + ", " + i);
      let player = getPlayerInfo(matchData, playerId);
      // console.log("got player info");
      let loadout = getLoadoutInfo(matchData, loadoutId);
      loadout.Skills.sort((a, b) => {
        let itemA = getSkillItem(matchData, a);
        let itemB = getSkillItem(matchData, b);
        return SKILL_ORDER.indexOf(itemA.Name) - SKILL_ORDER.indexOf(itemB.Name);
      })


      listElements[i].innerHTML = "<div></div><span></span>";
      listElements[i].querySelector("span").textContent = player.Name.substring(0, player.Name.length - 5);

      let loadoutDiv = listElements[i].querySelector("div");
      let roleImg = document.createElement("img");
      let roleImages = { 1: "pilot.png", 2: "engineer.png", 4: "gunner.png" };
      roleImg.src = `images/class-icons/${roleImages[loadout.Class]}`;
      loadoutDiv.append(roleImg);
      for (let l = 0; l < loadout.Skills.length; l++) {
        let skillItem = getSkillItem(matchData, loadout.Skills[l]);
        let skillImg = document.createElement("img");
        skillImg.src = `/images/item-icons/${skillItem.IconPath}`;
        loadoutDiv.append(skillImg);
      }
    }
    // Paint ship preview

    let shipInfo = getShipLoadout(matchData, matchData.Ships[teamIdx][shipIdx]);
    let shipItem = getShipItem(matchData, shipInfo.ShipModel);
    let gunPositions = shipItem.GunPositions;
    let shipLoadout = shipInfo.Loadout;
    let shipModel = shipInfo.ShipModel;

    let canvas = this.querySelector("canvas");
    let ctx = canvas.getContext("2d");
    let shipImage = await loadImageAsync(ship_image_srcs2[shipModel]);

    // Find gun bounding rectangle.
    let maxY, minY, minX, maxX;
    for (let i = 0; i < gunPositions.length; i++) {
      let [x, y] = gunPositions[i];
      if (minX == undefined || x < minX) minX = x;
      if (maxX == undefined || x > maxX) maxX = x;
      if (minY == undefined || y < minY) minY = y;
      if (maxY == undefined || y > maxY) maxY = y;
      // break;
    }
    // maxX = toShipImageCoordinates([maxX, 0], shipModel, shipImage)[0];
    // minX = toShipImageCoordinates([minX, 0], shipModel, shipImage)[0];
    maxY = toShipImageCoordinates([0, maxY], shipModel, shipImage)[1];
    minY = toShipImageCoordinates([0, minY], shipModel, shipImage)[1];

    let centerX = shipImage.width / 2
    // let centerX = (minX + maxX) / 2;
    let centerY = (minY + maxY) / 2;

    resetMatrix(this.transform);
    // translateMatrix(this.transform, canvas.width/2 - , canvas.height/2 - shipImage.height/2);
    // zoomMatrixAround(this.transform, canvas.width/2, canvas.height/2, 0.4);
    translateMatrix(this.transform, canvas.width / 2 - centerX, canvas.height / 2 - centerY);
    zoomMatrixAround(this.transform, canvas.width / 2, canvas.height / 2, 0.5);
    applyMatrix(ctx, this.transform);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(shipImage, 0, 0);

    let iconSize = 100;
    // Spread close guns out from eachother 
    let adjustedGunPositions = [];
    for (let i = 0; i < gunPositions.length; i++) {
      let pos = toShipImageCoordinates(gunPositions[i], shipModel, shipImage);
      adjustedGunPositions.push(pos);
    }
    adjustedGunPositions = spreadGunPositions(adjustedGunPositions, iconSize);

    // Draw gun icons.
    for (let i = 0; i < shipLoadout.length; i++) {
      let gunId = shipLoadout[i];
      if (gunId == 0) continue;
      let gunInfo = getGunItem(matchData, gunId);
      let gunImage = await loadImageAsync(`/images/item-icons/${gunInfo.IconPath}`);

      // let [cx, cy] = toShipImageCoordinates(adjustedGunPositions[i], shipModel, shipImage);
      let [cx, cy] = adjustedGunPositions[i];
      ctx.drawImage(gunImage, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);

      // let boxSize = 25;
      // let [cx2, cy2] = toShipImageCoordinates(gunPositions[i], shipModel, shipImage);
      // ctx.fillStyle = "red";
      // ctx.beginPath();
      // ctx.rect(cx2-boxSize/2, cy2-boxSize/2, boxSize, boxSize); 
      // ctx.fill();
      // ctx.stroke();

      // ctx.beginPath();
      // ctx.fillStyle = "black";
      // ctx.font = "30px Arial"; 
      // ctx.textAlign = "center"; 
      // ctx.fillText(i, cx2, cy2+10); 
      // ctx.stroke();

    }
  }
}

class MatchHistoryEntryOverview extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add("overview-table");
    this.innerHTML = `
            <div class="matchup">
                <div class="matchup-table">
                    <div class="red-team">
                        <img src="">
                        <br>
                        <img src="">
                    </div>
                    <div class="results">5:2</div>
                    <div class="blue-team">
                        <img src="">
                        <br>
                        <img src="">
                    </div>
                </div>
            </div>
            <div class="info">
                <div class="map">Misty Mutiny</div>
                <div class="time">11m 14s</div>
                <br>
                <br>
                <div class="date">x days ago</div>
            </div>
            <div class="tags">
            </div>
            <div class="players">
                <div class="blue-players">
                    <ul></ul>
                    <ul></ul>
                </div>
                <div class="red-players">
                    <ul></ul>
                    <ul></ul>
                </div>
            </div>
            <div class="expand-button"><i class="fas fa-chevron-down"></i></div>
        `;
    this.querySelector(".expand-button").addEventListener("click", evt => {
      // evt.target.parentElement.parentElement.toggleFoldout();
      this.parentElement.toggleFoldout();
    });
  }
  fillData(matchData) {
    // this.querySelectorAll(".matchup-table .red-team img")
    let mapName = "unknown map";
    let gameMode = "unknown game mode";
    if (matchData.MapItem[0]) {
      mapName = matchData.MapItem[0].Name;
      gameMode = game_modes[matchData.MapItem[0].GameMode];
    }
    else {

      console.log(matchData.MapId);
    }
    this.querySelector(".info .map").textContent = `${mapName}\n${gameMode}`;

    let timeMinutes = Math.floor(matchData.MatchTime / 60);
    let timeSeconds = matchData.MatchTime % 60;
    let timeString = `${timeMinutes != 0 ? `${timeMinutes}m` : ""} ${timeSeconds}s`;
    this.querySelector(".time").textContent = timeString;

    let msAgo = Date.now() - matchData.Timestamp;
    let minutesAgo = msAgo / 1000 / 60;
    let hoursAgo = minutesAgo / 60;
    let daysAgo = hoursAgo / 24;
    let monthsAgo = daysAgo / 30.437;
    let timeAgoString = "";
    if (monthsAgo > 1) timeAgoString = `${Math.floor(monthsAgo)} months ago`;
    else if (daysAgo > 1) timeAgoString = `${Math.floor(daysAgo)} days ago`;
    else if (hoursAgo > 1) timeAgoString = `${Math.floor(hoursAgo)} hours ago`;
    else timeAgoString = `${Math.ceil(minutesAgo)} minutes ago`;
    this.querySelector(".info .date").textContent = timeAgoString;

    // Load results and ships
    this.querySelector(".matchup-table .results").textContent = `${matchData.Scores[0]}:${matchData.Scores[1]}`;
    // Load ships
    for (let t in matchData.Ships) {
      for (let s in matchData.Ships[t]) {
        let shipInfo = getShipLoadout(matchData, matchData.Ships[t][s]);
        let shipItem = getShipItem(matchData, shipInfo.ShipModel);
        let img = this.querySelector(`.matchup-table ${t == 0 ? ".red-team" : ".blue-team"} img:nth-of-type(${Number(s) + 1})`);
        img.src = `/images/item-icons/${shipItem.IconPath}`;
      }
    }

    // Load tags

    let tagDiv = this.querySelector(".tags");
    for (let tag in matchData.CompetetiveTags) {
      if (tag == "HighLevel") continue;
      if (matchData.CompetetiveTags[tag]) {
        let s = document.createElement('span');
        s.classList.add(tag);
        if (tag == "SCS") s.textContent = "SCS";
        if (tag == "Competitive") s.textContent = "Competitive";
        tagDiv.append(s);
      }
    }

    // Add players
    for (let t in matchData.Players) {
      for (let s in matchData.Players[t]) {
        for (let p in matchData.Players[t][s]) {
          let playerId = matchData.Players[t][s][p];
          let loadoutId = matchData.Skills[t][s][p];
          let nametag = document.createElement('li', { is: 'player-nametag' });
          nametag.fillData(playerId, loadoutId, matchData.PlayerInfo, matchData.LoadoutInfo);
          this.querySelector(`.players .${t == 0 ? "red" : "blue"}-players ul:nth-child(${Number(s) + 1})`).append(nametag);
        }
      }

    }
  }
}

class PlayerNametag extends HTMLLIElement {
  constructor() {
    super();
    this.classList.add("nametag");
    this.innerHTML = `<img src="images/class-icons/gunner.png"><span></span>`;
  }
  fillData(playerId, loadoutId, playerInfo, LoadoutInfo) {

    let name;
    let playerClass;

    if (playerId == -1) {
      // AI crew
      name = "AI"
      playerClass = 5;
    }
    else {
      // Regular player
      for (let pInfo of playerInfo) {
        if (pInfo._id != playerId) continue;
        name = pInfo.Name.substring(0, pInfo.Name.length - 5);
        break;
      }

      for (let sInfo of LoadoutInfo) {
        if (sInfo._id != loadoutId) continue;
        playerClass = sInfo.Class;
        break;
      }
    }

    this.querySelector("span").textContent = name;
    let roleImages = { 1: "pilot.png", 2: "engineer.png", 4: "gunner.png", 5: "neutral.png" };
    this.querySelector("img").src = `images/class-icons/${roleImages[playerClass]}`;
  }
}


customElements.define('match-history-list', MatchHistoryList, { extends: 'ul' });
customElements.define('match-history-entry', MatchHistoryEntry, { extends: 'li' });
customElements.define('match-history-overview', MatchHistoryEntryOverview, { extends: 'div' });
customElements.define('match-history-foldout', MatchHistoryFoldout, { extends: 'div' });
customElements.define('match-history-details', MatchHistoryDetails, { extends: 'div' });
customElements.define('match-history-shipcrew', ShipCrew, { extends: 'div' });
customElements.define('player-nametag', PlayerNametag, { extends: 'li' });