class EloCard extends HTMLDivElement {
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
          `;
          this.querySelector('.elo-group-select').addEventListener('change', (event) => {
            const rankingGroup = this.querySelector('.elo-group-select').value;
            this.requestDataUpdate(this.playerId, rankingGroup);
          });
    }

    initialize(playerId, categories) {
        this.playerId = playerId;
        for(const category of categories) {
            this.addCategory(category);
        }
        this.initializeChart();
        if (categories.length != 0) {
            this.requestDataUpdate(this.playerId, this.querySelector('.elo-group-select').value);
        }
    }

    addCategory(categoryTitle) {
        const option = document.createElement('option');
        option.value = categoryTitle;
        option.text = categoryTitle;
        if (option.text == 'SCS') option.selected = 'selected';
        this.querySelector('.elo-group-select').append(option);
    }

    async requestDataUpdate(playerId, rankingGroup) {
        console.log('REQUESTING UPDATE')
        console.log(rankingGroup)
        // TODO: request available ranking groups first.
        let response = await fetch('/player_rating', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({playerId: playerId, rankingGroup: rankingGroup})
        });
        let eloData = await response.json();
        const ladderRank = eloData.LadderRank;
        eloData = eloData.Timeline;

        console.log(eloData)
        
        this.querySelector('.elo-text').textContent = eloData[eloData.length - 1].elo;
        let matches = 0;
        for (const d of eloData) {
            matches += d.count;
        }
        this.querySelector('.matches-text').textContent = matches;
        this.querySelector('.ladder-text').textContent = `#${ladderRank}`;


        this.chart.data.datasets.pop();
        this.chart.data.datasets.push({
            label: 'Datalabel',
            data: eloData,
            fill: 'start',
            borderColor: 'rgb(75, 192, 192)',
        });
        this.chart.update();

        document.querySelector('.leaderboard-card').requestDataUpdate(rankingGroup, ladderRank - 1);
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


customElements.define('elo-card', EloCard, { extends: 'div' });