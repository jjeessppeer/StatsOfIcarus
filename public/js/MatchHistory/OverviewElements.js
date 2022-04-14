class ShipPopularityElement extends HTMLLIElement {
    constructor() {
        super();
        this.classList.add("ship-popularity-element");
        this.innerHTML = `
            <img>
            <div class="shipname"><a></a></div>
            <div class="rates">
                <div class="shippopularity">POPULARITY</div>
                <div class="shipwins">WINS</div>
            </div>`;
    }

    initialize(modelWinrate, totalPicks) {
        let shipItem = modelWinrate.ShipItem[0];
        this.querySelector('img').src = `images/item-icons/${shipItem.IconPath}`;
        this.querySelector('.shipname a').textContent = shipItem.Name;

        let picked = modelWinrate.PlayedGames;
        let pickRate = picked / totalPicks;
        let wins = modelWinrate.Wins;
        let winRate = wins / picked; 
        this.querySelector('.shippopularity').textContent = `Picked: ${precise(pickRate*100, 2)}% [${picked}]`;
        this.querySelector('.shipwins').textContent = `Winrate: ${precise(winRate*100, 2)}% [${wins}]`;
    }
}



customElements.define('ship-popularity-element', ShipPopularityElement, { extends: 'li' });