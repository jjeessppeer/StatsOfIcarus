

const gameModes = {
  2: "Deathmatch",
  3: "VIP Deathmatch",
  4: "King of the Hill",
  5: "Crazy King",
}

const defaultDisabledMaps = [
  "Batcave",
  "Crown Gambit"
];

export class TournamentGenerator extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      selectedModes: { 2: true },
      shipCount: 2,
      teamCount: 2,
      mapList: [],
      enabledMaps: {},
      matchCount: 8,
      outputMaps: [],
      requestMaps: false
    }
  }

  componentDidUpdate() {
    if (this.state.requestMaps)
      this.fetchMaps();
  }

  componentDidMount() {
    // if (this.state.requestMaps)
    this.fetchMaps();
  }

  async fetchMaps() {
    let mapList = [];
    for (const modeId in this.state.selectedModes) {
      if (!this.state.selectedModes[modeId]) continue;
      const mapFetch = await fetch(`/maps/${modeId}/${this.state.teamCount}/${this.state.shipCount}`);
      const mapItems = await mapFetch.json();
      mapList = mapList.concat(mapItems);
    }
    mapList.sort((a, b) => (a.Name > b.Name))

    const enabledMaps = {};
    for (const mapItem of mapList) {
      enabledMaps[mapItem.Id] = !defaultDisabledMaps.includes(mapItem.Name);
    }

    this.setState({
      mapList: mapList,
      enabledMaps: enabledMaps,
      requestMaps: false
    });
  }

  modeChanged = (evt) => {
    const selectedModes = { ...this.state.selectedModes };
    selectedModes[evt.target.value] = evt.target.checked;
    this.setState({
      selectedModes: selectedModes,
      requestMaps: true
    });
  }

  teamCountChanged = (evt) => {
    this.setState({
      teamCount: evt.target.value,
      requestMaps: true
    });
  }

  shipCountChanged = (evt) => {
    this.setState({
      shipCount: evt.target.value,
      requestMaps: true
    });
  }

  mapToggled = (evt) => {
    const enabledMaps = { ...this.state.enabledMaps };
    enabledMaps[evt.target.value] = evt.target.checked;
    this.setState({
      enabledMaps: enabledMaps,
    });
  }

  gameCountChanged = (evt) => {
    console.log(evt.target.value);
    this.setState({
      matchCount: evt.target.value,
    });
  }

  generateMapSet = (evt) => {
    const enabledMaps = this.state.mapList.filter(el => this.state.enabledMaps[el.Id]);
    if (enabledMaps.length == 0) return;

    const outputMaps = [];
    let availableMaps = [...enabledMaps];
    for (let i = 0; i < this.state.matchCount; i++) {
      if (availableMaps.length == 0) {
        // Repeat maps if all have been played.
        availableMaps = [...enabledMaps];
      }
      const r = Math.floor(Math.random() * availableMaps.length);
      outputMaps.push(availableMaps[r]);
      availableMaps.splice(r, 1);
    }
    this.setState({
      outputMaps: outputMaps
    });
  }

  render() {
    const modeChecks = [];
    for (const modeId in gameModes) {
      modeChecks.push(
        <label>
          <input type="checkbox"
            checked={this.state.selectedModes[modeId] == true}
            value={modeId}
            onChange={this.modeChanged}
          ></input>
          {gameModes[modeId]}
        </label>
      )
    }

    const teamChecks = [];
    for (const i of [2, 4]) {
      teamChecks.push(
        <label>
          <input type="radio"
            value={i}
            checked={i == this.state.teamCount}
            onChange={this.teamCountChanged}></input>
          {i}
        </label>
      )
    }

    const shipChecks = [];
    for (const i of [2, 3, 4]) {
      shipChecks.push(
        <label>
          <input type="radio"
            value={i}
            checked={i == this.state.shipCount}
            onChange={this.shipCountChanged}></input>
          {i}
        </label>
      )
    }

    const mapChecks = this.state.mapList.map(mapItem => (
      <label>
        <input type="checkbox"
          value={mapItem.Id}
          checked={this.state.enabledMaps[mapItem.Id]}
          onChange={this.mapToggled}>
        </input>
        {mapItem.Name}
      </label>
    ));

    const outputList = this.state.outputMaps.map((mapItem, idx) => (
      <li>{`${idx+1}. ${mapItem.Name}`}</li>
    ));

    return (
      <div>
        <h3>Tournament randomizer</h3>
        <div className="tournmanent-randomizer">
          <b>Game Modes</b><br />
          <div className="mode-inputs">
            {modeChecks}
          </div>
          <b>{"Ships per team"}</b><br />
          <div>
            {shipChecks}
          </div>
          <b>{"Teams"}</b><br />
          <div>
            {teamChecks}
          </div>
          <b>{"Map pool"}</b><br />
          <div className="map-checks">
            {mapChecks.length != 0 ? mapChecks : "No maps matching criteria"}
          </div>

          <div>
            <input className="match-count" type="number" value={this.state.matchCount} onChange={this.gameCountChanged} />
          </div>

          <button class="btn btn-info" onClick={this.generateMapSet}>Generate map set</button>


          {outputList.length != 0 && <div className="output-list">
            <b>{"Games to play"}</b><br />

            <ul>{outputList}</ul>
          </div>}
        </div>
      </div>
    )
  }
}