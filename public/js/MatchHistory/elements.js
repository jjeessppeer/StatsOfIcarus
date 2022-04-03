


class MatchHistoryEntry extends HTMLLIElement {
    constructor() {
        super();
        this.classList.add("match-history-entry");

        this.innerHTML = ``;
        this.overview = document.createElement('div', {is: 'match-history-overview'});
        this.prepend(this.overview);
    }
    fillData(matchData) {
        this.overview.fillData(matchData);
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
    }
    fillData(matchData){
        // this.querySelectorAll(".matchup-table .red-team img")
        this.querySelector(".matchup-table .results").textContent = `${matchData.Scores[0]}:${matchData.Scores[1]}`;
        this.querySelector(".matchup-table").classList.add(matchData.Winner == 0 ? "blue-winner" : "red-winner"); // Move to top element.
        this.querySelector(".info .map").textContent = `MapId: ${matchData.MapId}`; // Move to top element.

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
customElements.define('player-nametag', PlayerNametag, { extends: 'li' });