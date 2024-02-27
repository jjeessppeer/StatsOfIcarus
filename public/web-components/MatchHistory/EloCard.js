export class EloCard extends HTMLDivElement {
  static observedAttributes = ["player-id"];

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
      <div is="player-leaderboard" />
      `;
    this.querySelector('.elo-group-select').addEventListener('change', (event) => {
      // const rankingGroup = this.querySelector('.elo-group-select').value;
      // this.requestDataUpdate(this.playerId, rankingGroup);
      this.requestData();
    });
    this.addCategory("Overall");
    this.addCategory("Competitive");
    this.addCategory("SCS");

    this.initializeChart();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "player-id":
        console.log("PLAYER ID CHANGED");
        this.requestData();
        break;
    }
  }

  async requestData() {
    const category = this.querySelector(".elo-group-select").value;
    const playerId = this.getAttribute("player-id");
    console.log("FETCHING ELO DATA", playerId, category);
    const eloData = await fetch(`/player/${playerId}/elo/${category}`).then(res => res.json());
    console.log(eloData);

    const eloTimeline = eloData.EloTimeline;
    const matchCount = eloTimeline.reduce((acc, el) => (acc + el.count), 0);

    this.querySelector('.ladder-text').textContent = `#${eloData.LeaderboardPosition}`;
    this.querySelector('.elo-text').textContent = eloTimeline[eloTimeline.length - 1].elo;
    this.querySelector('.matches-text').textContent = matchCount;

    this.chart.data.datasets.pop();
    this.chart.data.datasets.push({
      label: 'Datalabel',
      data: eloTimeline,
      fill: 'start',
      borderColor: 'rgb(75, 192, 192)',
    });
    this.chart.update();
  }


  addCategory(categoryTitle) {
    const option = document.createElement('option');
    option.value = categoryTitle;
    option.text = categoryTitle;
    if (option.text == 'SCS') option.selected = 'selected';
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