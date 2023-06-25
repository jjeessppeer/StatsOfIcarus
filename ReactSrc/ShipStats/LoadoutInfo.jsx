import { ShipCanvas } from '/React/ShipCanvas.js';
// import { LoadoutInfoFoldout } from './LoadoutFoldout';
import { LoadoutInfoFoldout } from './LoadoutFoldout.js';
import { LoadoutGroupingSettings } from '/React/ShipStats/LoadoutGroupingSettings.js';
import { mergeLoadoutInfos, mapLoadoutId, mergeMatchupStats, loadoutStringToCanvasData } from '/React/ShipStats/LoadoutUtils.js';


export class ShipLoadoutInfoList extends React.Component {
  render() {
    const componentArray = [
    ]
    const page = 0;
    const pageSize = 20;
    for (const loadoutInfo of this.props.loadoutInfos) {
      componentArray.push(<ShipLoadoutInfo loadoutInfo={loadoutInfo}></ShipLoadoutInfo>);
      if (componentArray.length == pageSize) break;
    }
    return (
      <ul className="ship-loadout-list">
        <LoadoutGroupingSettings></LoadoutGroupingSettings>
        {componentArray}
      </ul>
    )
  }
}

// Render your React component instead
export class ShipLoadoutInfo extends React.Component {
  constructor(props) {
    super(props);

    const canvasData = loadoutStringToCanvasData(this.props.loadoutInfo._id)

    this.state = {
      loadout: JSON.parse(this.props.loadoutInfo._id),
      loadedMatchups: false,
      matchupStats: [],
      matchupsExpanded: false,
      canvasData: canvasData
    }
  }

  toggleDetailFoldout = async (e) => {
    console.log("TOGGLE FOLDOT")
    // console.log(this);
    // console.log(e);


    let matchupStats = this.state.matchupStats;
    if (!this.state.loadedMatchups) matchupStats = await this.loadMatchups();
    console.log(matchupStats);
    this.setState((state, props) => ({
      matchupStats: matchupStats,
      matchupsExpanded: !state.matchupsExpanded
    }));
  }


  async loadMatchups() {
    const rawRes = await fetch('/ship_matchup_stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ TargetShip: { Model: this.state.loadout[0].model } })
    });
    const matchupStats = await rawRes.json();
    const mergedMatchupStats = mergeMatchupStats(matchupStats);
    return mergedMatchupStats;
    // this.setState({matchupStats: mergedMatchupStats});
  }

  render() {
    const rateProps = {
      picks: this.props.loadoutInfo.PlayedGames,
      totalPicks: this.props.loadoutInfo.TotalGames,
      matches: 4,
      totalMatches: 5,
      wins: this.props.loadoutInfo.Wins
    };
    const pickRate = rateProps.picks / rateProps.totalPicks;
    const matchRate = rateProps.matches / rateProps.totalMatches;
    const winRate = rateProps.wins / rateProps.picks;


    return (
      <li className={"ship-loadout-info" + (this.state.matchupsExpanded ? " expanded" : "")}>
        <div className="info-card">
          <div className='content'>
            <ShipCanvas {...this.state.canvasData} width='150' height='250'></ShipCanvas>
            <div>hello</div>
            <div>
              <table className="ship-rates">
                <tr>
                  <td>Pick rate:</td>
                  <td>{pickRate * 100}% [{rateProps.picks}]</td>
                </tr>
                <tr>
                  <td>Win rate: </td>
                  <td>{winRate * 100}% [{rateProps.wins}]</td>
                </tr>
                <tr>
                  <td>Match rate: </td>
                  <td>{matchRate * 100}% [{rateProps.matches}]</td>
                </tr>
              </table>
            </div>

          </div>
          <div className='expand-button-bar'>
            <LoadoutExpandButton onExpand={this.toggleDetailFoldout} name={'Enemy matchups'}></LoadoutExpandButton>
            <LoadoutExpandButton onExpand={this.toggleDetailFoldout} name={'Ally synergies'}></LoadoutExpandButton>
            {/* <LoadoutExpandButton onExpand={this.toggleTab} name={'Strong with'}></LoadoutExpandButton> */}
            {/* <LoadoutExpandButton onExpand={this.toggleTab} name={'Weak with'}></LoadoutExpandButton> */}
          </div>
        </div>

        <LoadoutInfoFoldout matchupStats={this.state.matchupStats}></LoadoutInfoFoldout>
      </li>

    )
  }
}

function LoadoutExpandButton(props) {
  return (
    <div class="loadout-expand-button" onClick={props.onExpand}>
      {props.name}
      <i class="fas fa-chevron-down"></i>
    </div>
  )
}