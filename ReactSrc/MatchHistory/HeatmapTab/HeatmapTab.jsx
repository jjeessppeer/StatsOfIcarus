
import { Slider } from '/React/Slider.js';
import { SliderTimelineBackground } from '/React/MatchHistory/HeatmapTab/SliderBackground.js';
import { Heatmap } from '/React/MatchHistory/HeatmapTab/Heatmap.js';
import { getDeaths, getEndTimestamp, filterPositonData, fixPositionData } from '/React/MatchHistory/HeatmapTab/HeatmapUtils.js';

import { positionToCanvasPixel } from '/React/MatchHistory/HeatmapTab/HeatmapUtils.js';

export class HeatmapTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shipPositions: [],
      noData: true,
      loading: true,
      timelineRange: [0, 100],
      maxTime: 100,
      heatmapRadius: 21,
      heatmapBlur: 21,
      heatmapStrength: 0.05,
      enabledShips: [true, true, true, true],
      enabledTeams: [true, true],
      canvasType: 'heatmap',
      mapItem: undefined
    }

    this.fetchData();
  }

  async fetchData() {
    const response = await fetch(`/match/${this.props.MatchId}/positionData`);
    if (response.status != 200) {
      this.setState({ loading: false, noData: true });
      return;
    }
    const json = await response.json();
    const positionData = fixPositionData(json, this.props);
    const endTimestamp = getEndTimestamp(positionData);

    const mapItemFetch = await fetch(`/game-item/map/${this.props.MapId}`);
    const mapItem = await mapItemFetch.json();
    console.log("MAP: ", mapItem);

    const minutes = this.props.MatchTime / 60;
    const strengthScale = 10 / minutes;

    this.setState({
      loading: false,
      noData: false,
      shipPositions: positionData,
      timelineRange: [0, endTimestamp],
      maxTime: endTimestamp,
      heatmapStrength: 0.05 * strengthScale,
      mapItem: mapItem
    });
  }

  timelineRangeChanged = (range) => {
    // const s = 2 - 1 * (range[1] - range[0]) / this.state.maxTime;
    // const s = 1;
    const minutes = this.props.MatchTime / 60;
    const strengthScale = 10 / minutes;

    this.setState({
      timelineRange: range,
      heatmapStrength: 0.05 * strengthScale,
    });
  }

  toggleShip = (idx) => {
    let enabledShips = [...this.state.enabledShips];
    enabledShips[idx] = !enabledShips[idx];
    this.setState({
      enabledShips: enabledShips
    })
  }

  toggleTeam = (idx) => {
    let enabledTeams = [...this.state.enabledTeams];
    enabledTeams[idx] = !enabledTeams[idx];
    this.setState({
      enabledTeams: enabledTeams
    });
  }

  changeCanvasType = (evt) => {
    this.setState({
      canvasType: evt.target.value
    })
  }

  setHMRadius = (evt) => {
    this.setState({
      heatmapRadius: evt.target.value / 2
    });
  }

  setHMStrength = (evt) => {
    this.setState({
      heatmapStrength: evt.target.value / 300,
    });
  }

  setHMBlur = (evt) => {
    console.log(evt.target.value / 2)
    this.setState({
      heatmapBlur: evt.target.value / 2,
    });
  }

  render() {
    if (this.state.loading) {
      return (<div>Loading...</div>);
    }
    if (this.state.noData) {
      return (<div>No position data for match.</div>);
    }
    const filteredPos = filterPositonData(
      this.state.shipPositions,
      this.state.timelineRange[0], this.state.timelineRange[1],
      this.state.enabledShips,
      this.state.enabledTeams);
    return (
      <div className="heatmap-tab">
        <Heatmap
          MapId={this.props.MapId}
          mapItem={this.state.mapItem}
          shipPositions={filteredPos}
          width={500} height={500}
          heatmapRadius={this.state.heatmapRadius}
          heatmapStrength={this.state.heatmapStrength}
          heatmapBlur={this.state.heatmapBlur}
          canvasType={this.state.canvasType}
        />
        <div className='settings'>
          <div>
            Limit timespan
            <Slider min={0} max={this.state.maxTime} valueChanged={this.timelineRangeChanged}>
              <SliderTimelineBackground matchTime={this.props.MatchTime} deaths={getDeaths(this.state.shipPositions)}></SliderTimelineBackground>
            </Slider>
          </div>
          <div>
            <label>
              <input type="radio" value='heatmap'
                onChange={this.changeCanvasType}
                checked={this.state.canvasType == 'heatmap'} />
              Heatmap
            </label>
            <label>
              <input type="radio" value='paths'
                onChange={this.changeCanvasType}
                checked={this.state.canvasType == 'paths'} />
              Paths
            </label>
          </div>
          <div>
            Displayed ships
            <div>
              <div className='team-checkboxes'>
                <input type='checkbox' checked={this.state.enabledTeams[0]} onChange={() => this.toggleTeam(0)}></input>
                <div>
                  <label className='red'>
                    <input type="checkbox"
                      checked={this.state.enabledShips[0]}
                      disabled={!this.state.enabledTeams[0]}
                      onChange={() => this.toggleShip(0)} />
                    {this.props.ShipNames[0][0]}
                  </label>
                  <label className='red'>
                    <input type="checkbox"
                      checked={this.state.enabledShips[1]}
                      disabled={!this.state.enabledTeams[0]}
                      onChange={() => this.toggleShip(1)} />
                    {this.props.ShipNames[0][1]}
                  </label>
                </div>
              </div>

              <div className='team-checkboxes'>
                <input type='checkbox' checked={this.state.enabledTeams[1]} onChange={() => this.toggleTeam(1)}></input>
                <div>
                  <label className='blue'>
                    <input type="checkbox"
                      checked={this.state.enabledShips[2]}
                      disabled={!this.state.enabledTeams[1]}
                      onChange={() => this.toggleShip(2)} />
                    {this.props.ShipNames[1][0]}
                  </label>
                  <label className='blue'>
                    <input type="checkbox"
                      checked={this.state.enabledShips[3]}
                      disabled={!this.state.enabledTeams[1]}
                      onChange={() => this.toggleShip(3)} />
                    {this.props.ShipNames[1][1]}
                  </label>
                </div>
              </div>


            </div>
          </div>

          {/* <input type="range" min="0" max="100" onChange={this.setHMRadius} value={this.state.heatmapRadius * 2} /> */}
          {/* <input type="range" min="0" max="100" onChange={this.setHMBlur} value={this.state.heatmapBlur * 2} /> */}
          {/* <input type="range" min="0" max="100" onChange={this.setHMStrength} value={this.state.heatmapStrength * 300} /> */}
        </div>
      </div>
    );
  }
}

class Pathmap extends React.Component {

}



