import { ShipCanvas } from '/React/ShipCanvas.js';
// import { LoadoutInfoFoldout } from './LoadoutFoldout';
import { LoadoutInfoFoldout } from './LoadoutFoldout.js';
import { LoadoutGroupingSettings } from '/React/ShipStats/LoadoutGroupingSettings.js';
import { mergeLoadoutInfos, mapLoadoutId, mergeMatchupStats, loadoutStringToCanvasData } from '/React/ShipStats/LoadoutUtils.js';




export class ShipLoadoutInfoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      groupingSettings: {
        ignoredGunIndexes: {
          0: true,
          1: true,
          2: false,
          3: false,
          4: false,
          5: false
        }
      }
    }
  }

  groupingSettingsChanged = (groupingSettings) => {
    console.log("SETTINGS SCHANGEID");
    console.log(groupingSettings);
    this.setState({
      groupingSettings: groupingSettings
    });
  }

  render() {
    const componentArray = [
    ]
    const mergedLoadoutInfos = mergeLoadoutInfos(
      this.props.loadoutInfos, 
      this.state.groupingSettings);

    const totalShipGames = this.props.loadoutInfos.reduce((partialSum, a) => partialSum + a.PlayedGames, 0);
    const page = 0;
    const pageSize = 20;
    for (const loadoutInfo of mergedLoadoutInfos) {
      componentArray.push(<ShipLoadoutInfo loadoutInfo={loadoutInfo} totalShipGames={totalShipGames}></ShipLoadoutInfo>);
      if (componentArray.length == pageSize) break;
    }
    return (
      <ul className="ship-loadout-list">
        <LoadoutGroupingSettings settings={this.state.groupingSettings} settingsChanged={this.groupingSettingsChanged}></LoadoutGroupingSettings>
        {componentArray}
      </ul>
    )
  }
}

// Render your React component instead
export class ShipLoadoutInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loadout: JSON.parse(this.props.loadoutInfo._id),
      loadedMatchups: false,
      matchupStats: [],
      matchupsExpanded: false,
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
      wins: this.props.loadoutInfo.Wins
    };
    const pickRate = rateProps.picks / this.props.totalShipGames;
    const matchRate = rateProps.matches / rateProps.totalMatches;
    const winRate = rateProps.wins / rateProps.picks;

    function toPercentage(n, tot) {
      return Math.round(100 * n / tot);
    }

    
    const canvasData = loadoutStringToCanvasData(this.props.loadoutInfo._id)


    return (
      <li className={"ship-loadout-info" + (this.state.matchupsExpanded ? " expanded" : "")}>
        <div className="info-card">
          <div className='content'>
            <ShipCanvas {...canvasData} width='250' height='250'></ShipCanvas>
            <div>
              <table className="ship-rates">
                <tr>
                  <td>Pick rate:</td>
                  <td>{toPercentage(this.props.loadoutInfo.PlayedGames, this.props.totalShipGames)}% [{this.props.loadoutInfo.PlayedGames}]</td>
                </tr>
                <tr>
                  <td>Win rate: </td>
                  <td>{toPercentage(this.props.loadoutInfo.Wins, this.props.loadoutInfo.PlayedGames)}% [{this.props.loadoutInfo.Wins}]</td>
                </tr>
                <tr>
                  <td>Performance: </td>
                  <td>-</td>
                </tr>
                <tr>
                  <td>Mirror rate: </td>
                  <td>{toPercentage(this.props.loadoutInfo.Mirrors, this.props.loadoutInfo.PlayedGames)}% [{this.props.loadoutInfo.Mirrors}]</td>
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