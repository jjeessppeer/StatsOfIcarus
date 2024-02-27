import { CLASS_COLORS } from '/js/constants.js';

class PlayerInfoBox extends HTMLDivElement {
  constructor() {
    super();
    this.classList.add('player-infobox')

    this.innerHTML = `
        <div>
          <div>
            <span class="clan-name">[CLAN]</span>
            <span class="player-name">PLAYERNAME</span>
          </div>
          <div>
            <span class="match-count">1336 matches</span>
          </div>
        <div>
        <div class="charts">
          <div class="chart-container">
            <canvas class="playrates"></canvas>
          </div>
          <div class="chart-container">
            <canvas class="winrates"></canvas>
          </div>
        </div>
        `;

    // Initialize charts
  }

  initialize(playerData) {
    this.querySelector('.clan-name').textContent = playerData.Clan === "" ? "" : `[${playerData.Clan}]`;
    this.querySelector('.player-name').textContent = playerData.Name.substring(0, playerData.Name.length - 5);
    this.querySelector('.match-count').textContent = ``;
  }

  initializePlayrateChart(winrates) {
    let classCounts = [0, 0, 0];
    let classIndexMap = {
      1: 2,
      2: 0,
      4: 1
    };

    winrates.ClassRates.forEach(el => {
      classCounts[classIndexMap[el._id]] = el.MatchCount;
    });

    const data = {
      labels: [
        'Engineer',
        'Gunner',
        'Pilot'
      ],
      datasets: [{
        label: 'Playrates',
        data: classCounts,
        backgroundColor: [
          CLASS_COLORS.Engineer,
          CLASS_COLORS.Gunner,
          CLASS_COLORS.Pilot,
        ],
        hoverOffset: 4
      }]
    };
    const config = {
      type: 'pie',
      data: data,
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            text: "Played classes",
            display: true
          },
          legend: {
            display: false
          },
        }
      }

    };
    let canvas = this.querySelector('.playrates');
    let chart = new Chart(canvas, config);
  }

  initializeWinrateChart(winrates) {
    let classCounts = [
      [0, 1],
      [0, 1],
      [0, 1]
    ];
    let classIndexMap = {
      1: 2,
      2: 0,
      4: 1
    };
    winrates.ClassRates.forEach(el => {
      classCounts[classIndexMap[el._id]][0] = el.Wins;
      classCounts[classIndexMap[el._id]][1] = el.MatchCount - el.Wins;
    });

    const data = {
      labels: [
        'wins',
        'losses'
      ],
      datasets: [
        {
          label: 'Engineer',
          data: classCounts[0],
          backgroundColor: [
            CLASS_COLORS.Pilot,
            CLASS_COLORS.Gunner
          ],
          hoverOffset: 4
        },
        {
          label: 'Gunner',
          data: classCounts[1],
          backgroundColor: [
            CLASS_COLORS.Pilot,
            CLASS_COLORS.Gunner
          ],
          hoverOffset: 4
        },
        {
          label: 'Pilot',
          data: classCounts[2],
          backgroundColor: [
            CLASS_COLORS.Pilot,
            CLASS_COLORS.Gunner
          ],
          hoverOffset: 4
        }
      ]
    };
    const config = {
      type: 'doughnut',
      data: data,
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            text: "Class winrates",
            display: true
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let sum = 0;
                context.dataset.data.map(data => {
                  sum += data;
                });
                let percentage = (context.raw * 100 / sum).toFixed(0) + "%";
                let description = `${context.dataset.label} ${context.label} ${percentage} [${context.raw}]`
                return description;
              }
            }
          }
        }
      }

    };
    let canvas = this.querySelector('.winrates');
    let chart = new Chart(canvas, config);

  }
}




customElements.define('player-info-box', PlayerInfoBox, { extends: 'div' });