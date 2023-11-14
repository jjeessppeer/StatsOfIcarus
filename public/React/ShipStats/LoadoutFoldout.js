function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
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
    };
  }
  groupingSettingsChanged = groupingSettings => {
    if (groupingSettings.modelFilter == -1) {
      groupingSettings.gunSelections = [-2, -2, -2, -2, -2, -2];
    }
    if (groupingSettings.modelFilter != -1 && this.state.groupingSettings.modelFilter != groupingSettings.modelFilter) {
      groupingSettings.gunSelections = [-1, -1, -1, -1, -1, -1];
    }
    this.setState({
      groupingSettings: groupingSettings
    });
  };
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
      const elorate = enemyMode ? eloWinrate(s.ExpectedOutcomeVs, s.ActualOutcomeVs, PlayedGames) : eloWinrate(s.ExpectedOutcomeWith, s.ActualOutcomeWith, PlayedGames);
      const props = {
        _id: s._id,
        PlayedGames,
        wins,
        elorate,
        ExpectedOutcome,
        ActualOutcome
      };
      if (PlayedGames != 0) {
        matchupComponents.push( /*#__PURE__*/React.createElement(LoadoutMatchup, _extends({
          key: s._id
        }, props, {
          foldoutMode: this.props.foldoutMode
        })));
      }
    }
    matchupComponents.sort((a, b) => {
      a = a.props;
      b = b.props;
      const C = 10;
      const m = enemyMode ? 0.65 : 0.35;
      const e1 = eloWinrate(b.ExpectedOutcome, b.ActualOutcome, b.PlayedGames);
      const e2 = eloWinrate(a.ExpectedOutcome, a.ActualOutcome, a.PlayedGames);
      const w1 = (C * m + e1 * b.PlayedGames) / (C + b.PlayedGames);
      const w2 = (C * m + e2 * a.PlayedGames) / (C + a.PlayedGames);
      return enemyMode ? w2 - w1 : w1 - w2;
    });

    // const 
    const colorClass = this.props.foldoutMode == 'Enemy matchups' ? 'enemy' : 'ally';

    // Fetch matchups
    // merge according to settings
    return /*#__PURE__*/React.createElement("div", {
      className: `loadout-matchup-foldout info-card ${colorClass}`
    }, /*#__PURE__*/React.createElement(LoadoutGroupingSettings, {
      settings: this.state.groupingSettings,
      settingsChanged: this.groupingSettingsChanged
    }), matchupComponents);
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
    return /*#__PURE__*/React.createElement("div", {
      className: "loadout-matchup-box"
    }, /*#__PURE__*/React.createElement(ShipCanvas, _extends({}, canvasData, {
      width: "175"
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", null, this.props.foldoutMode == 'Enemy matchups' ? 'Matchup' : 'Team comp', " played: ", this.props.PlayedGames), /*#__PURE__*/React.createElement("div", null, "Win rate: ", toPercentage(this.props.wins, this.props.PlayedGames), "% [", this.props.wins, "]"), /*#__PURE__*/React.createElement("div", null, "Elo adjusted: ", toPercentage(this.props.elorate, 1), "%")));
  }
}