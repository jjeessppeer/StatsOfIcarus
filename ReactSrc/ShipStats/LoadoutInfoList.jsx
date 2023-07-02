import { LoadoutGroupingSettings } from '/React/ShipStats/LoadoutGroupingSettings.js';
import { ShipLoadoutInfo } from '/React/ShipStats/LoadoutInfo.js';
import { filterLoadoutArray, mergeLoadoutInfos, mapLoadoutId, mergeMatchupStats, loadoutStringToCanvasData, SHIP_GUN_IDX_MAP } from '/React/ShipStats/LoadoutUtils.js';

export class ShipLoadoutInfoList extends React.Component {
  constructor(props) {
    super(props);
    let model = -1;
    if (this.props.loadoutInfos[0])
      model = JSON.parse(this.props.loadoutInfos[0]._id)[0].model;

    this.state = {
      groupingSettings: {
        gunSelections: [-1, -1, -1, -1, -1, -1],
        ignoredGunIndexes: {
          0: false,
          1: false,
          2: false,
          3: false,
          4: false,
          5: false
        },
        modelFilter: model,
        modelFilterEnabled: false
      }
    }
  }

  groupingSettingsChanged = (groupingSettings) => {
    console.log(groupingSettings);
    this.setState({
      groupingSettings: groupingSettings
    });
  }

  render() {
    let model = -1;
    if (this.props.loadoutInfos[0])
      model = JSON.parse(this.props.loadoutInfos[0]._id)[0].model;
    console.log("MODEL: ", model);
    const filteredLoadoutInfos = filterLoadoutArray(this.props.loadoutInfos, this.state.groupingSettings);



    const mergedLoadoutInfos = mergeLoadoutInfos(
      filteredLoadoutInfos,
      this.state.groupingSettings);

    const totalShipGames = this.props.loadoutInfos.reduce((partialSum, a) => partialSum + a.PlayedGames, 0);
    const componentArray = []
    const page = 0;
    const pageSize = 20;
    for (const loadoutInfo of mergedLoadoutInfos) {
      componentArray.push(<ShipLoadoutInfo key={loadoutInfo._id} loadoutInfo={loadoutInfo} totalShipGames={totalShipGames}></ShipLoadoutInfo>);
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