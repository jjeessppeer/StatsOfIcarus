import { ShipCanvas } from '/React/ShipCanvas.js';
import { LoadoutInfoFoldout } from './LoadoutFoldout.js';
import { mergeLoadoutInfos, mapLoadoutId, mergeMatchupStats, loadoutStringToCanvasData } from '/React/ShipStats/LoadoutUtils.js';

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
    console.log(this.state.loadout);
    const matchupStats = await rawRes.json();
    const groupingSettings = {
      ignoredGunIndexes: {
        0: true,
        1: true,
        2: true,
        3: true,
        4: true,
        5: true
      }
    };
    const mergedMatchupStats = mergeMatchupStats(matchupStats, groupingSettings);
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


    const eR = this.props.loadoutInfo.ExpectedOutcome / this.props.loadoutInfo.PlayedGames;
    const aR = this.props.loadoutInfo.ActualOutcome / this.props.loadoutInfo.PlayedGames;
    const f1 = 1/2 * (aR/eR);
    const f2 = 1/2 * (1 + (aR - eR) / (1 - eR));
    let f3;
    if (aR > eR) f3 = f2;
    else f3 = f1; 

    return (
      <li className={"ship-loadout-info" + (this.state.matchupsExpanded ? " expanded" : "")}>
        <div className="info-card">
          <div className='content'>
            <ShipCanvas {...canvasData} width='250' height='250'></ShipCanvas>
            <div className="text-area">
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
                  <td>Elo adjusted:</td>
                  <td>{toPercentage(f3, 1)}%</td>
                </tr>
                <tr>
                  <td>Mirror rate: </td>
                  <td>{toPercentage(this.props.loadoutInfo.Mirrors, this.props.loadoutInfo.PlayedGames)}% [{this.props.loadoutInfo.Mirrors}]</td>
                </tr>
              </table>
              {this.props.loadoutInfo.OriginalIds.length > 1 && 
                <div className="bottom-text">
                  Contains stats from {this.props.loadoutInfo.OriginalIds.length} unique loadouts.
                </div>
              }
              
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