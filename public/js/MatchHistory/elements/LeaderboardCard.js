const LEADERBOARD_PAGE_SIZE = 10;

class LeaderboardCard extends HTMLDivElement {
    constructor() {
        super();
        this.classList.add('player-infobox');
        this.classList.add('leaderboard-card');

        this.innerHTML = `
            <div>
                <table>
                </table>
            </div>
            <div class="input-group pagination">
                <div class="input-group-prepend">
                    <button class="btn btn-info back-button" type="button" data-delta="-1">🠔</button>
                    <button class="btn btn-warn" type="button">1</button>
                </div>
                <div class="input-group-append">
                    <button class="btn btn-info forward-button" type="button" data-delta="1">🠖</button>
                </div>

            </div>
          `;
          this.querySelector('.back-button').addEventListener('click', (evt) => {
            this.requestDataUpdate(this.currentGroup, this.currentPosition - LEADERBOARD_PAGE_SIZE);
          });
          this.querySelector('.forward-button').addEventListener('click', (evt) => {
            this.requestDataUpdate(this.currentGroup, this.currentPosition + LEADERBOARD_PAGE_SIZE);
          });
          this.currentPage = 1;
          this.requestDataUpdate('scs', 1);
    }

    addItem(rank, name, points, highlight = false) {
        const li = document.createElement('tr');
        li.innerHTML = `
            <td class="ladder-rank">#${rank}</td>
            <td class="ladder-name">${name}</td>
            <td class="ladder-points">${points}pts</td>`;
        li.classList.toggle('highlight', highlight);
        this.querySelector('table').append(li);
    }

    setHighlightName(name) {
        this.highlightName = name;
        console.log("NAME: ", name);
    }

    async requestDataUpdate(rankingGroup, ladderPosition) {
        this.currentPosition = Math.max(ladderPosition, 0);
        this.currentGroup = rankingGroup;

        let response = await fetch('/leaderboard_page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({RatingGroup: this.currentGroup, Position: this.currentPosition})
        });
        let data = await response.json();
        this.querySelector('table').innerHTML = '';
        for (const playerRank of data) {
            this.addItem(playerRank.LadderRank, playerRank.Name.slice(0, -5), playerRank.Points, playerRank.Name == this.highlightName);
        }
    }

    lockInput() {

    }

    unlockInput() {

    }
}

customElements.define('leaderboard-card', LeaderboardCard, { extends: 'div' });