


class MatchHistoryEntry extends HTMLLIElement {
    constructor() {
        super();
        this.classList.add("match-history-entry");

        this.innerHTML = ``;
        let overview = document.createElement('div', {is: 'match-history-overview'});
        this.appendChild(overview);
    }
    fillData(matchBasicData) {

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
                <div class="date">58 days ago</div>
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
        `;
    }
}


customElements.define('match-history-entry', MatchHistoryEntry, { extends: 'li' });
customElements.define('match-history-overview', MatchHistoryEntryOverview, { extends: 'div' });