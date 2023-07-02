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
      matchupGroupingSettings: {
        // ignoredGunIndexes: {
        //   0: true,
        //   1: true,
        //   2: true,
        //   3: true,
        //   4: true,
        //   5: true
        // }
        ignoredGunIndexes: {
          0: false,
          1: false,
          2: false,
          3: false,
          4: false,
          5: false
        }
      }
    }
  }

  toggleDetailFoldout = async (name) => {
    let matchupStats = this.state.matchupStats;
    if (!this.state.loadedMatchups) matchupStats = await this.loadMatchups();

    const enemyModePrev = this.state.foldoutMode == 'Enemy matchups';
    const enemyModeNext = name == 'Enemy matchups';
    const expand = (enemyModeNext != enemyModePrev || !this.state.matchupsExpanded);

    this.setState((state, props) => ({
      matchupStats: matchupStats,
      matchupsExpanded: expand,
      foldoutMode: name
    }));
  }

  async loadMatchups() {
    const rawRes = await fetch('/ship_matchup_stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ TargetShip: this.state.loadout })
    });
    const matchupStats = await rawRes.json();
    return matchupStats;
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

    // const mergedMatchupStats = mergeMatchupStats(matchupStats, this.state.matchupGroupingSettings);

    const eR = this.props.loadoutInfo.ExpectedOutcome / this.props.loadoutInfo.PlayedGames;
    const aR = this.props.loadoutInfo.ActualOutcome / this.props.loadoutInfo.PlayedGames;
    const f1 = 1/2 * (aR/eR);
    const f2 = 1/2 * (1 + (aR - eR) / (1 - eR));
    let f3;
    if (aR > eR) f3 = f2;
    else f3 = f1; 

    const enemyMode = this.state.foldoutMode == 'Enemy matchups';
    const expanded = this.state.matchupsExpanded;
    const b1State = enemyMode && expanded;
    const b2State = !enemyMode && expanded;

    return (
      <li className={"ship-loadout-info" + (this.state.matchupsExpanded ? " expanded" : "")}>
        <div className="info-card">
          <div className='content'>
            <ShipCanvas {...canvasData} width='175' height='250'></ShipCanvas>
            <div className="text-area">
              <table className="ship-rates">
                <tr>
                  <td>Win rate: </td>
                  <td>{toPercentage(this.props.loadoutInfo.Wins, this.props.loadoutInfo.PlayedGames)}% [{this.props.loadoutInfo.Wins}]</td>
                </tr>
                <tr>
                  <td>Elo adjusted:</td>
                  <td>{toPercentage(f3, 1)}%</td>
                </tr>
                <tr>
                  <td>Pick rate:</td>
                  <td>{toPercentage(this.props.loadoutInfo.PlayedGames, this.props.totalShipGames)}% [{this.props.loadoutInfo.PlayedGames}]</td>
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
            <LoadoutExpandButton onExpand={this.toggleDetailFoldout} name={'Enemy matchups'} active={b1State}></LoadoutExpandButton>
            <LoadoutExpandButton onExpand={this.toggleDetailFoldout} name={'Ally synergies'} active={b2State}></LoadoutExpandButton>
            {/* <LoadoutExpandButton onExpand={this.toggleTab} name={'Strong with'}></LoadoutExpandButton> */}
            {/* <LoadoutExpandButton onExpand={this.toggleTab} name={'Weak with'}></LoadoutExpandButton> */}
          </div>
        </div>

        <LoadoutInfoFoldout foldoutMode={this.state.foldoutMode} matchupStats={this.state.matchupStats}></LoadoutInfoFoldout>
      </li>

    )
  }
}

class LoadoutExpandButton extends React.Component {
  onExpand = () => {
    this.props.onExpand(this.props.name);
  }
  render() {
    return (
      <div class={`loadout-expand-button ${this.props.active ? 'active' : ''}`} onClick={this.onExpand}>
        {this.props.name}
        <i class="fas fa-chevron-down"></i>
      </div>
    )
  }
  
}