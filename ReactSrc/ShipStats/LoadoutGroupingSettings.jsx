
import {GunDropdown, GunSelectionRow} from '/React/GunDropdown.js'




export class LoadoutGroupingSettings extends React.Component {
  constructor(props) {
    super(props);
  }

  gunToggled = (idx, active) => {
    const settings = JSON.parse(JSON.stringify(this.props.settings));
    settings.ignoredGunIndexes[idx] = active;
    this.props.settingsChanged(settings);
  }

  gunSelectionChanged = (idx, itemId) => {
    const settings = JSON.parse(JSON.stringify(this.props.settings));
    settings.gunSelections[idx-1] = itemId;
    this.props.settingsChanged(settings);
  }

  render() {
    const gunToggles = [];
    // console.log(this.props.settings);
    for (let i = 0; i < 6; i++) {
      gunToggles.push(
        <GunToggle 
          gunIndex={i} 
          handleChange={this.gunToggled} 
          active={this.props.settings.ignoredGunIndexes[i]}>  
        </GunToggle>
      );
    }
    // public\images\item-icons\item114.jpg
    return (
      <div className="loadout-grouping-settings">
        <h5>Loadout grouping</h5>
        {/* <div>
          Minimum matches <input type="number" defaultValue={10} disabled></input>
        </div>
        <div>
          <label>Mirrored loadouts <input type="checkbox" disabled></input></label>
        </div> */}
        <GunSelectionRow selections={this.props.settings.gunSelections} handleChange={this.gunSelectionChanged}></GunSelectionRow>
        <div>
          Ignored gun slots:
          {gunToggles}
        </div>
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