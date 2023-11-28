
import { Slider } from '/React/Slider.js';
import { SliderTimelineBackground } from '/React/MatchHistory/HeatmapTab/SliderBackground.js';
import { Heatmap } from '/React/MatchHistory/HeatmapTab/Heatmap.js';
import { getDeaths, getEndTimestamp, filterPositonData } from '/React/MatchHistory/HeatmapTab/HeatmapUtils.js';

export class HeatmapTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shipPositions: [],
      noData: true,
      loading: true,
      timelineRange: [0, 100],
      maxTime: 100
    }

    this.fetchData();
  }

  async fetchData() {
    // console.log("MAP: " + this.props.MapId);
    const response = await fetch(`/match/${this.props.MatchId}/positionData`);
    if (response.status != 200) {
      this.setState({ loading: false, noData: true });
      return;
    }
    const json = await response.json();
    console.log(json);
    // TODO: filter out fake ships.

    const endTimestamp = getEndTimestamp(json);
    // console.log("ET0: ", endTimestamp);

    this.setState({
      loading: false,
      noData: false,
      shipPositions: json,
      timelineRange: [0, endTimestamp],
      maxTime: endTimestamp
    });
  }

  timelineRangeChanged = (range) => {
    this.setState({
      timelineRange: range
    });
  }


  render() {
    if (this.state.loading) {
      return (<div></div>);
    }
    if (this.state.noData) {
      return (<div>No position data for match.</div>);
    }
    const filteredPos = filterPositonData(this.state.shipPositions, this.state.timelineRange[0], this.state.timelineRange[1]);
    return (
      <div className="heatmap-tab">
        <Heatmap MapId={this.props.MapId} shipPositions={filteredPos} width={500} height={500}></Heatmap>
        <div className='settings'>
          Limit timespan
          <Slider min={0} max={this.state.maxTime} valueChanged={this.timelineRangeChanged}>
            <SliderTimelineBackground matchTime={this.props.MatchTime} deaths={getDeaths(this.state.shipPositions)}></SliderTimelineBackground>
          </Slider>
        </div>
      </div>
    );
  }
}

class Pathmap extends React.Component {

}



