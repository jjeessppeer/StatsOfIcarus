import { LoadoutGroupingSettings } from '/React/ShipStats/LoadoutGroupingSettings.js';
import { ShipLoadoutInfo } from '/React/ShipStats/LoadoutInfo.js';
import { mergeLoadoutInfos, mapLoadoutId, mergeMatchupStats, loadoutStringToCanvasData } from '/React/ShipStats/LoadoutUtils.js';

export class ShipLoadoutInfoList extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        groupingSettings: {
          ignoredGunIndexes: {
            0: true,
            1: true,
            2: true,
            3: true,
            4: true,
            5: true
          }
        }
      }
    }
  
    groupingSettingsChanged = (groupingSettings) => {
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