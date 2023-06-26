

export class LoadoutGroupingSettings extends React.Component {
  constructor(props) {
    super(props);
    // this.state = {
    //   ignoredGunIndexes: {
    //     0: false,
    //     1: false,
    //     2: false,
    //     3: false,
    //     4: false,
    //     5: false
    //   }
    // }
  }

  // settingsChanged = () => {
  //   this.props.onChange(this.state);
  // }

  gunToggled = (idx, active) => {
    // console.log(idx, ': ', active);

    const settings = JSON.parse(JSON.stringify(this.props.settings));
    settings.ignoredGunIndexes[idx] = active;
    this.props.settingsChanged(settings);
    // this.setState((prevState) => ({
    //   ...prevState,
    //   ignoredGunIndexes: {
    //     ...prevState.ignoredGunIndexes,
    //     [idx]: active
    //   }
    // }));
    // if (active) {
    //   this.state.ignoredGuns.push(idx);
    // }
    // else {
    //   this.state.
    // }
    
    // this.props.settingsChanged(JSON.parse(JSON.stringify(this.state)));
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

    return (
      <div className="loadout-grouping-settings">
        <h5>Loadout grouping</h5>
        <div>
          Minimum matches <input type="number" defaultValue={10}></input>
        </div>
        <div>
          <label>Mirrored loadouts <input type="checkbox"></input></label>
        </div>
        <div>
          Guns:
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