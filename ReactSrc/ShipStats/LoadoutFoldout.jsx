import { ShipCanvas } from '/React/ShipCanvas.js';
import { loadoutStringToCanvasData, eloWinrate } from '/React/ShipStats/LoadoutUtils.js';
import { mergeMatchupStats, filterLoadoutArray } from '/React/ShipStats/LoadoutUtils.js';
import { LoadoutGroupingSettings } from '/React/ShipStats/LoadoutGroupingSettings.js';

export class LoadoutInfoFoldout extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            groupingSettings: {
                gunSelections: [-2, -2, -2, -2, -2, -2],
                ignoredGunIndexes: {
                  0: false,
                  1: false,
                  2: false,
                  3: false,
                  4: false,
                  5: false
                },
                sortingDisabled: true,
                modelFilterEnabled: true,
                modelFilter: -1
              }
        }
    }

    groupingSettingsChanged = (groupingSettings) => {
        if (groupingSettings.modelFilter == -1) {
            groupingSettings.gunSelections = [-2, -2, -2, -2, -2, -2]
        }
        if (groupingSettings.modelFilter != -1 && 
            this.state.groupingSettings.modelFilter != groupingSettings.modelFilter) {
                groupingSettings.gunSelections = [-1, -1, -1, -1, -1, -1]
            }
        this.setState({
          groupingSettings: groupingSettings
        });
      }

    render() {
        const matchupComponents = [];
        const filteredMatchupStats = filterLoadoutArray(this.props.matchupStats, this.state.groupingSettings);
        const mergedMatchupStats = mergeMatchupStats(filteredMatchupStats, this.state.groupingSettings);
        const enemyMode = this.props.foldoutMode == 'Enemy matchups';
        for (const s of mergedMatchupStats) {
            const PlayedGames = enemyMode ? s.PlayedVs : s.PlayedWith;
            const wins = enemyMode ? s.WinsVs : s.WinsWith;
            const winrate = wins / PlayedGames;
            const ExpectedOutcome = enemyMode ? s.ExpectedOutcomeVs : s.ExpectedOutcomeWith;
            const ActualOutcome = enemyMode ? s.ActualOutcomeVs : s.ActualOutcomeWith;
            const elorate = enemyMode ? 
                eloWinrate(s.ExpectedOutcomeVs, s.ActualOutcomeVs, PlayedGames) :
                eloWinrate(s.ExpectedOutcomeWith, s.ActualOutcomeWith, PlayedGames);
            const props = {_id: s._id, PlayedGames, wins, elorate, ExpectedOutcome, ActualOutcome};
            if (PlayedGames != 0){
                matchupComponents.push(<LoadoutMatchup key={s._id} {...props} foldoutMode={this.props.foldoutMode}></LoadoutMatchup>);
            }
        }

        matchupComponents.sort((a, b) => {
            a = a.props;
            b = b.props;
            const C = 10;
            const m = (enemyMode ? 0.65 : 0.35);
            const e1 = eloWinrate(b.ExpectedOutcome, b.ActualOutcome, b.PlayedGames);
            const e2 = eloWinrate(a.ExpectedOutcome, a.ActualOutcome, a.PlayedGames);
            const w1 = (C*m + e1 * b.PlayedGames ) / (C + b.PlayedGames);
            const w2 = (C*m + e2 * a.PlayedGames ) / (C + a.PlayedGames);
            return (enemyMode ? w2 - w1 : w1 - w2);
        });

        // const 
        const colorClass = this.props.foldoutMode == 'Enemy matchups' ? 'enemy' : 'ally';

        // Fetch matchups
        // merge according to settings
        return (
            <div className={`loadout-matchup-foldout info-card ${colorClass}`}>
                <LoadoutGroupingSettings settings={this.state.groupingSettings} settingsChanged={this.groupingSettingsChanged}></LoadoutGroupingSettings>
                {/* <LoadoutGroupingSettings settings={groupingSettings}></LoadoutGroupingSettings> */}
                {matchupComponents}
                {/* <LoadoutMatchup></LoadoutMatchup> */}
                {/* <LoadoutMatchup></LoadoutMatchup> */}
            </div>
        )
    }
}


class LoadoutMatchup extends React.Component {
    
    render() {
        function toPercentage(n, tot) {
            return Math.round(100 * n / tot);
        }
        // console.log(this.props.foldoutMode)
        // const enemyMode = this.props.foldoutMode == 'Enemy matchups';
        // const played = enemyMode ? this.props.PlayedVs : this.props.PlayedWith;
        // const wins = enemyMode ? this.props.WinsVs : this.props.WinsWith;
        // const winrate = wins / played;
        // const elorate = enemyMode ? 
        //     eloWinrate(this.props.ExpectedOutcomeVs, this.props.ActualOutcomeVs, played) :
        //     eloWinrate(this.props.ExpectedOutcomeWith, this.props.ActualOutcomeWith, played);
        

        const canvasData = loadoutStringToCanvasData(this.props._id);
        return (
            <div className="loadout-matchup-box">
                <ShipCanvas {...canvasData} width="175"></ShipCanvas>
                <div>
                    <div>{this.props.foldoutMode == 'Enemy matchups' ? 'Matchup' : 'Team comp'} played: {this.props.PlayedGames}</div>
                    <div>Win rate: {toPercentage(this.props.wins, this.props.PlayedGames)}% [{this.props.wins}]</div>
                    <div>Elo adjusted: {toPercentage(this.props.elorate, 1)}%</div>
                </div>
            </div>
        )
    }
}