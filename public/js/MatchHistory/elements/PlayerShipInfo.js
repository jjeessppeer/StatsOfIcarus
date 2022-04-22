class PlayerShipInfoTable extends HTMLDivElement {
    constructor() {
      super();
  
      this.classList.add("player-ship-info-table");
      this.innerHTML = `
        <div class="ship-list">
        </div>
        `;
    }
  
    initialize(shipRates) {
      let modelInfos = {};
      for (let rates of shipRates.ModelStats) {
        // if (rates._id != 15) continue;
        let cell = document.createElement('div', { is: 'player-ship-info-cell' });
        cell.initialize(rates);
        this.querySelector('.ship-list').append(cell);
        // break;
      }
    }
  }
  
  class PlayerShipInfoCell extends HTMLDivElement {
    constructor() {
      super();
  
      this.classList.add("player-ship-info-cell");
      this.innerHTML = `
        <img>
        <div class="shipname"><a></a></div>
        <div class="numbers">
          <div class="winrate">52%</div>
          <div class="picks">123 played</div>
        </div>
        <div class="barcharts">
          <div class="chart-container">
            <canvas></canvas>
          </div>
        </div>`;
      // <canvas class="pickrate"></canvas>
    }
  
    initialize(rates) {
      let winrate = rates.Wins / rates.MatchCount;
      this.querySelector('.winrate').textContent = `${Math.round(winrate*100)}%`;
      this.querySelector('.picks').textContent = `${rates.MatchCount} played`;
  
      // 1-Pilot, 2-engineer, 4-gunner
      let classGameCount = {
        1: 0, 
        2: 0, 
        4: 0};
      for (let classInfo of rates.ClassStats) {
        classGameCount[classInfo.PlayerClass] = classInfo.MatchCount;
      }
      this.querySelector('img').src = `images/item-icons/ship${rates._id}.jpg`;
      const labels = ['Classes'];
      const data = {
        labels: labels,
        datasets: [
          {
            label: 'Wins',
            data: [rates.Wins],
            backgroundColor: 'rgb(0, 105, 166)',
            stack: 'Stack 1',
          },
          {
            label: 'Losses',
            data: [rates.MatchCount - rates.Wins],
            backgroundColor: 'rgb(198, 68, 62)',
            stack: 'Stack 1',
          },
          {
            label: 'Pilot',
            data: [classGameCount[1]],
            backgroundColor: 'rgb(85, 135, 170)',
            stack: 'Stack 0',
          },
          {
            label: 'Gunner',
            data: [classGameCount[4]],
            backgroundColor: 'rgb(167, 76, 18)',
            stack: 'Stack 0',
          },
          {
            label: 'Engi',
            data: [classGameCount[2]],
            backgroundColor: 'rgb(189, 137, 45)',
            stack: 'Stack 0',
          },
          
        ]
      };
  
      const config = {
        type: 'bar',
        data: data,
        options: {
          animation: false,
          // barThickness: 'flex',
          barPercentage: 0.9,
          // borderSkipped: false,
          categoryPercentage: 1,
          barPercentage: 0.9,
          indexAxis: 'y',
          plugins: {
            title: {
              display: false
            },
            legend: {
              display: false
            },
            tooltip: {
              usePointStyle: false,
              callbacks: {
                title: function (context) {
                  return '';
                },
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
          },
          scales: {
            x: {
              display: false,
              stacked: true,
              min: 0,
              max: rates.MatchCount,
            },
            y: {
              // min: 0,
              // max: rates.MatchCount,
              display: false,
              stacked: true
            }
          }
        }
      };
      let canvas = this.querySelector('canvas');
      let chart = new Chart(canvas, config);
    }
  }
  
  
  
  customElements.define('player-ship-info-table', PlayerShipInfoTable, { extends: 'div' });
  customElements.define('player-ship-info-cell', PlayerShipInfoCell, { extends: 'div' });