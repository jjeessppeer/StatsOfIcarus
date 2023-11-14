
import { GunDropdown, GunSelectionRow } from '/React/GunDropdown.js';
import { ShipDropdown } from '/React/ShipStats/ShipDropdown.js';
import { getShipItem } from '/React/ShipStats/LoadoutUtils.js';



export class LoadoutGroupingSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gunCount: 6
    }
  }



  componentDidMount() {
    this.updateGunCount();
  }

  componentDidUpdate() {
    this.updateGunCount();
  }

  updateGunCount() {
    const model = this.props.settings.modelFilter;
    if (model != -1) {
      this._asyncRequest = getShipItem(model).then(
        shipItem => {
          this._asyncRequest = null;
          if (shipItem.gunCount != this.state.gunCount)
            this.setState({ gunCount: shipItem.GunCount });
        });
    }
    else {
      if (6 != this.state.gunCount)
        this.setState({ gunCount: 6 });
    }
  }

  gunToggled = (idx, active) => {
    const settings = JSON.parse(JSON.stringify(this.props.settings));
    settings.ignoredGunIndexes[idx] = active;
    if (!this.props.settingsChanged) return;
    this.props.settingsChanged(settings);
  }

  gunSelectionChanged = (idx, itemId) => {
    const settings = JSON.parse(JSON.stringify(this.props.settings));
    settings.gunSelections[idx - 1] = itemId;
    if (!this.props.settingsChanged) return;
    this.props.settingsChanged(settings);
  }

  shipSelectionChanged = (shipModel) => {
    const settings = JSON.parse(JSON.stringify(this.props.settings));
    settings.modelFilter = shipModel;
    if (!this.props.settingsChanged) return;
    this.props.settingsChanged(settings);
  }

  render() {

    const showGunSelections = !this.props.settings.modelFilterEnabled || this.props.settings.modelFilter != -1;


    // let gunCount = 6;
    // if (this.props.settings.modelFilter != -1) {
    //   const shipItem = await getShipItem(this.props.settings.modelFilter);
    //   gunCount = shipItem.GunCount;
    // }
    // const gunToggles = [];
    // for (let i = 0; i < 6; i++) {
    //   gunToggles.push(
    //     <GunToggle 
    //       gunIndex={i} 
    //       handleChange={this.gunToggled} 
    //       active={this.props.settings.ignoredGunIndexes[i]}>  
    //     </GunToggle>
    //   );
    // }
    // public\images\item-icons\item114.jpg
    return (
      <div className="loadout-grouping-settings">
        {/* <h5>Loadout grouping</h5> */}
        {/* <div>
          Minimum matches <input type="number" defaultValue={10} disabled></input>
        </div>
        <div>
          <label>Mirrored loadouts <input type="checkbox" disabled></input></label>
        </div> */}
        {this.props.settings.modelFilterEnabled &&
          <div>
            Ship: <ShipDropdown selectionChanged={this.shipSelectionChanged} selectedId={this.props.settings.modelFilter}></ShipDropdown>
          </div>}
        {showGunSelections &&
          <GunSelectionRow gunCount={this.state.gunCount} selections={this.props.settings.gunSelections} handleChange={this.gunSelectionChanged}>
          </GunSelectionRow>}

        {/* <br></br> */}
        {false &&
          <div>
            <label for="cars">Sorting:</label>
            <select autoComplete='off' disabled>
              <option value="best" selected>Win rate</option>
              <option value="best">Adjusted win rate</option>
              <option value="saab">Most played</option>
            </select>
          </div>}



        {/* <div>
          Ignored gun slots:
          {gunToggles}
        </div> */}
      </div>
    )
  }
}

class GunToggle extends React.Component {
  constructor(props) {
    super(props);
  }

  toggled = (e) => {
    const active = !this.props.active;
    const idx = this.props.gunIndex;
    this.props.handleChange(idx, active);
  }


  render() {
    return (
      <button
        className={`gun-toggle${this.props.active ? ' active' : ''}`}
        onClick={this.toggled} handleChange={this.props.handleChange}>
        {this.props.gunIndex + 1}
      </button>
    )
  }
}