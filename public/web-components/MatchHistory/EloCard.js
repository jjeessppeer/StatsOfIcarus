export class EloCard extends HTMLDivElement {
  set page(v) {
    this._page = v;
    this.querySelector(".page-indicator").textContent = v + 1;
  }

  get page() {
    return this._page;
  }

  get category() {
    return this.querySelector('.elo-group-select').value;
  }

  constructor() {
    super();
    this.classList.add('player-infobox');
    this.classList.add('elo-infobox');

    this.innerHTML = `
      <div>
        <div class="elo-top">
          <span>Elo: <b class="elo-text">1232</b></span>
          <span>Ladder rank: <b class="ladder-text">#X</b></span>
          <span>Matches: <b class="matches-text"></b></span>
          <select class="elo-group-select">
          </select> 
        </div>
        <div class="chart-flex">
        <div class="chart-container">
          <canvas class="elo-history"></canvas>
        </div>
        </div>
      </div>
      <div class="player-leaderboard">
      <h5>Leaderboard</h5>
        <div>
          <table>
          </table>
        </div>
        <div class="input-group pagination">
          <div class="input-group-prepend">
            <button class="btn btn-info back-button" type="button" data-delta="-1">🠔</button>
            <button class="btn btn-warn indicator-button page-indicator" type="button" disabled>1</button>
          </div>
          <div class="input-group-append">
            <button class="btn btn-info forward-button" type="button" data-delta="1">🠖</button>
          </div>
        </div>
      </div>
    `;

    this.playerId;
    this.page;

    this.addCategory("Overall");
    this.addCategory("Competitive");
    this.addCategory("SCS");

    this.initializeChart();
  }

  connectedCallback() {
    this.querySelector("h5").textContent = `Leaderboard - ${this.category}`;

    this.querySelector('.elo-group-select').addEventListener('change', (event) => {
      this.querySelector("h5").textContent = `Leaderboard - ${this.category}`;
      this.fetchEloData().then(() => {this.fetchLeaderboardPage();});
    });

    this.querySelector('.back-button').addEventListener('click', evt => {
      this.page = Math.max(0, this.page - 1);
      this.fetchLeaderboardPage();
    });
    this.querySelector('.forward-button').addEventListener('click', evt => {
      this.page = this.page + 1;
      this.fetchLeaderboardPage();
    });
  }

  async load(playerId) {
    this.playerId = playerId;
    await this.fetchEloData();
    await this.fetchLeaderboardPage();
  }

  async fetchEloData() {
    const category = this.category;
    const playerId = this.playerId;
    const eloData = await fetch(`/player/${playerId}/elo/${category}`).then(res => res.json());
    const eloTimeline = eloData.EloTimeline;

    const ladderRank = eloData.LeaderboardPosition !== 0 ? `#${eloData.LeaderboardPosition}` : "unranked"
    const currentElo = eloTimeline.length !== 0 ? eloTimeline[eloTimeline.length - 1].elo : "-";
    const matchCount = eloTimeline.reduce((acc, el) => (acc + el.count), 0);

    this.querySelector('.ladder-text').textContent = ladderRank;
    this.querySelector('.elo-text').textContent = currentElo;
    this.querySelector('.matches-text').textContent = matchCount;

    this.page = Math.floor(eloData.LeaderboardPosition / 10);

    this.chart.data.datasets.pop();
    this.chart.data.datasets.push({
      label: 'Datalabel',
      data: eloTimeline,
      fill: 'start',
      borderColor: 'rgb(75, 192, 192)',
    });
    this.chart.update();
  }

  async fetchLeaderboardPage() {
    const category = this.category;
    const page = this.page;

    const leaderboardPage = await fetch(`/leaderboard/${category}/${page}`).then(res => res.json());

    this.querySelector('table').innerHTML = '';
    for (const playerRank of leaderboardPage) {
      const li = document.createElement('tr');
      li.innerHTML = `
        <td class="ladder-rank">#${playerRank.LadderRank}</td>
        <td class="ladder-name">${playerRank.Name.slice(0, -5)}</td>
        <td class="ladder-points">${playerRank.Points}p</td>`;
      li.classList.toggle('highlight', playerRank._id == this.playerId);
      this.querySelector('table').append(li);
    }
  }


  addCategory(categoryTitle) {
    const option = document.createElement('option');
    option.value = categoryTitle;
    option.text = categoryTitle;
    if (option.text == "SCS") option.selected = 'selected';
    this.querySelector('.elo-group-select').append(option);
  }

  initializeChart() {
    const data = {
      datasets: [{
        label: 'My First Dataset',
        data: [],
        fill: 'start',
        borderColor: 'rgb(75, 192, 192)',
        // tension: 0.1
      }]
    };
    const config = {
      type: 'line',
      data: data,
      options: {
        animation: false,
        responsive: true,
        parsing: {
          xAxisKey: 'start',
          yAxisKey: 'elo'
        },
        scales: {
          y: {
            type: 'linear',
            grace: '20%',
            ticks: {
              // padding: 100
            }
          },
          x: {
            type: 'linear',
            // grace: '50%',
            // beginAtZero: true,
            bounds: 'data',
            ticks: {
              display: false,
              // padding: 0
              // min: 1000,
              // max: 2000,
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            displayColors: false,
            callbacks: {
              title: (context) => {
                const date = new Date(context[0].raw.end);

                return `${date.toLocaleDateString()}`;
              },
              label: function (context) {
                return [
                  `Elo: ${context.raw.elo}`,
                  `Change: ${(context.raw.delta >= 0 ? '+' : '') + context.raw.delta}`,
                  `Matches: ${context.raw.count}`
                ];
              }
            }
          }
        }
      }
    };

    let canvas = this.querySelector('.elo-history');
    // const chart = new Chart(canvas, config);
    this.chart = new Chart(canvas, config);
  }
}