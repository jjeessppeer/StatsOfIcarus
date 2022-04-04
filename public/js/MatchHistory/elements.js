


class MatchHistoryEntry extends HTMLLIElement {
    constructor() {
        super();
        this.classList.add("match-history-entry");
        this.classList.add("open");

        this.innerHTML = ``;
        this.overview = document.createElement('div', {is: 'match-history-overview'});
        this.foldout = document.createElement('div', {is: 'match-history-foldout'});
        this.prepend(this.overview);
        this.append(this.foldout);
    }
    fillData(matchData) {
        this.classList.add(matchData.Winner == 0 ? "red-winner" : "blue-winner"); // Move to top element.
        this.overview.fillData(matchData);
        this.foldout.details.fillData(matchData);
    }

    toggleFoldout(){
        this.classList.toggle("open");
        this.overview.querySelector(".expand-button i").classList.toggle("fa-chevron-down");
        this.overview.querySelector(".expand-button i").classList.toggle("fa-chevron-up");
    }
}

class MatchHistoryFoldout extends HTMLDivElement {
    constructor() {
        super();
        this.classList.add("foldout");
        this.innerHTML = `
            <ul>
                <li><button>Overview</button></li>
                <li><button>Gunnery Analysis</button></li>
                <li><button>Another button</button></li>
            </ul>
            <div class="content"></div>`;
        this.details = document.createElement('div', {is: 'match-history-details'});
        this.querySelector(".content").append(this.details);
    }
}

class MatchHistoryDetails extends HTMLDivElement {
    constructor(){
        super();
        this.classList.add("details");
        this.innerHTML = `
            <div>
                <div>t1s1</div>
                <div></div>
                <div>t2s1</div>
                <div></div>
            </div>
            <div>
                <div><canvas class="ship-canvas"></canvas></div>
                <div><ul></ul></div>
                <div><canvas class="ship-canvas"></canvas></div>
                <div><ul></ul></div>
            </div>
            <div>
                <div>t1s1</div>
                <div></div>
                <div>t2s1</div>
                <div></div>
            </div>
            <div>
                <div><canvas class="ship-canvas"></canvas></div>
                <div><ul></ul></div>
                <div><canvas class="ship-canvas"></canvas></div>
                <div><ul></ul></div>
            </div>
        `;
    }
    async fillData(matchData) {
        for (let t = 0; t < matchData.Players.length; t++) {
            let list1 = this.querySelectorAll("ul")[t];
            let list2 = this.querySelectorAll("ul")[t+2];
            list1.innerHTML = "";
            list2.innerHTML = "";
            for (let p = 0; p < matchData.Players[t].length; p++) {
                let list;
                if (p < 4) list = list1;
                else list = list2; 
                let li = document.createElement("li");
                let div = document.createElement("div");
                let span = document.createElement("span");

                li.append(div);
                li.append(span);

                let player = getPlayerInfo(matchData, matchData.Players[t][p]);
                span.textContent = player.Name;
                let loadout = getLoadoutInfo(matchData, matchData.Skills[t][p]);

                let roleImg = document.createElement("img");
                let roleImages = {1: "pilot.png", 2: "engineer.png", 4: "gunner.png"};
                roleImg.src = `images/class-icons/${roleImages[loadout.Class]}`;
                div.append(roleImg);
                for (let l = 0; l < loadout.Skills.length; l++) {
                    let skillImg = document.createElement("img");
                    skillImg.src = `/item-icon?Item=skill&Id=${loadout.Skills[l]}`;
                    div.append(skillImg);
                }

                
                list.append(li);
            }
            // break;
        }
    }
}

class ShipCanvas extends HTMLCanvasElement {
    constructor(){
        super();
        this.classList.add("player-list");
        this.innerHTML = `
            <ul>
            </ul>
        `;

    }
    async paintShip(){
        let ctx = this.getContext("2d");
    }

}


class MatchHistoryEntryOverview extends HTMLDivElement {
    constructor(){
        super();
        this.classList.add("overview-table");
        this.innerHTML = `
            <div class="matchup">
                <div class="matchup-table">
                    <div class="red-team">
                        <img src="images/ship-icons/Galleon.png">
                        <br>
                        <img src="images/ship-icons/Galleon.png">
                    </div>
                    <div class="results">5:2</div>
                    <div class="blue-team">
                        <img src="images/ship-icons/Galleon.png">
                        <br>
                        <img src="images/ship-icons/Galleon.png">
                    </div>
                </div>
            </div>
            <div class="info">
                <div class="map">Misty Mutiny</div>
                <div class="time">11m 14s</div>
                <br>
                <br>
                <div class="date">12 days ago</div>
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

        this.querySelector(".expand-button").addEventListener("click", () => {
            this.parentElement.toggleFoldout();
        });
    }
    fillData(matchData){
        // this.querySelectorAll(".matchup-table .red-team img")
        this.querySelector(".matchup-table .results").textContent = `${matchData.Scores[0]}:${matchData.Scores[1]}`;
        this.querySelector(".matchup-table").classList.add(matchData.Winner == 0 ? "blue-winner" : "red-winner"); // Move to top element.
        this.querySelector(".info .map").textContent = `MapId: ${matchData.MapId}`; // Move to top element.

        // Load ships
        for (let t in matchData.Ships) {
            for (let s in matchData.Ships[t]){
                let shipInfo = getShipInfo(matchData, matchData.Ships[t][s]);
                let img = this.querySelector(`.matchup-table ${t==0 ? ".red-team" : ".blue-team"} img:nth-of-type(${Number(s)+1})`);
                img.src = `item-icon?Item=ship&Id=${shipInfo.ShipModel}`;
            }
        }

        // Add players
        for (let t in matchData.Players) {
            for (let p in matchData.Players[t]) {
                let nametag = document.createElement('li', {is: 'player-nametag'});
                nametag.fillData(matchData.Players[t][p], matchData.Skills[t][p], matchData.PlayerInfo, matchData.SkillInfo);
                this.querySelector(`.players .${t==0 ? "red" : "blue"}-players ul:nth-of-type(${p <= 3 ? 1 : 2})`).append(nametag);
            }
        }
    }
}

class PlayerNametag extends HTMLLIElement {
    constructor(){
        super();
        this.classList.add("nametag");
        this.innerHTML = `<img src="images/class-icons/gunner.png"><span></span>`;
    }
    fillData(playerId, loadoutId, playerInfo, SkillInfo){
        let name;
        for (let pInfo of playerInfo) {
            if (pInfo._id != playerId) continue;
            name = pInfo.Name.substring(0, pInfo.Name.length-5);
            break;
        }
        this.querySelector("span").textContent = name;
        
        let loadout;
        for (let sInfo of SkillInfo) {
            if (sInfo._id != loadoutId) continue;
            loadout = sInfo;
            break;
        }

        let roleImages = {1: "pilot.png", 2: "engineer.png", 4: "gunner.png"};
        this.querySelector("img").src = `images/class-icons/${roleImages[loadout.Class]}`;

    }
}


customElements.define('match-history-entry', MatchHistoryEntry, { extends: 'li' });
customElements.define('match-history-overview', MatchHistoryEntryOverview, { extends: 'div' });
customElements.define('match-history-foldout', MatchHistoryFoldout, { extends: 'div' });
customElements.define('match-history-details', MatchHistoryDetails, { extends: 'div' });
customElements.define('player-nametag', PlayerNametag, { extends: 'li' });