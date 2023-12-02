import { ShipCanvas } from "/React/ShipBuilder/ShipCanvas2.js";
import { RangeVisualizer } from "/React/ShipBuilder/RangeVisualizer.js";
import { GunAngleVisualizer } from "/React/ShipBuilder/GunAngleVisualizer.js";

export class ShipBuilder extends React.PureComponent {
  constructor(props) {
    super(props);

    // Load state from url.
    // console.log("LOADEDSTATE");
    // console.log(window.location.hash.split('?')[1]);

    this.state = {
      selectedShip: this.props.shipItems[0],
      gunSelections: ["None", "None", "None", "None", "None", "None"],
      selectedAmmos: [undefined, undefined, undefined, undefined, undefined, undefined],
      loadStateFromUrl: true
    }
  }

  getStateFromExportString = (str) => {

  }

  nameChanged = (evt) => {
    this.setState({
      name: evt.target.value
    });
  }

  shipChanged = (evt) => {
    const shipItem = this.props.shipItems.find(el => el.Name == evt.target.value);
    this.setState({
      selectedShip: shipItem
    });
  }

  gunChanged = (evt, idx) => {
    const gunSelections = [...this.state.gunSelections];
    gunSelections[idx] = evt.target.value;
    this.setState({
      gunSelections: gunSelections
    });
  }

  ammoChanged = (evt, idx) => {
    const selectedAmmos = [...this.state.selectedAmmos];
    const ammoItem = this.props.ammoItems.find(el => el.Name == evt.target.value);
    selectedAmmos[idx] = ammoItem;
    this.setState({
      selectedAmmos: selectedAmmos
    });
  }

  render() {
    // Get ship loadout.
    const shipLoadout = [];
    for (const gunName of this.state.gunSelections) {
      if (gunName == "None") shipLoadout.push(-1);
      else {
        const gunItem = this.props.gunItems.find(el => el.Name == gunName);
        shipLoadout.push(gunItem.Id);
      }
    }
    const shipModel = this.state.selectedShip.Id;

    return (
      <div className="ship-builder">
        <h3>Ship builder</h3>

        <p>Build can be shared via the current URL or by copying and pasting in the textfield below and pressing
          import/export.</p>
        <div class="input-group import-group">
          <div class="input-group-prepend">
            <div class="input-group-text">Import build</div>
          </div>
          <input type="text" class="form-control" placeholder="" />
          <div class="input-group-append">
            <button class="btn btn-info" type="button">Import</button>
            <button class="btn btn-primary" type="button">Export</button>
          </div>
        </div>

        <ShipInputGroup
          nameChanged={this.nameChanged}
          gunChanged={this.gunChanged}
          ammoChanged={this.ammoChanged}
          shipChanged={this.shipChanged}
          gunItems={this.props.gunItems}
          ammoItems={this.props.ammoItems}
          shipItems={this.props.shipItems}
          selectedShip={this.state.selectedShip}
        />
        <div className="my-col">
          <b>Drag or scroll to pan or zoom image.</b>
          <br></br>
          <ShipCanvas width='600' height='600'
            movable={true}
            shipItem={this.state.selectedShip}
            gunItems={this.props.gunItems}
            selectedAmmos={this.state.selectedAmmos}
            shipLoadout={shipLoadout}
            shipModel={shipModel}
            adjustGunSpacing={false}
            renderGunArcs={true}
          ></ShipCanvas>
        </div>

        <div className="my-col">
          <b>Ship stats</b>
          <ShipStatBox shipItem={this.state.selectedShip} />
        </div>

        <div className="my-col">
          <h3>Range Visualization</h3>
          <RangeVisualizer
            shipItem={this.state.selectedShip}
            gunItems={this.props.gunItems}
            selectedAmmos={this.state.selectedAmmos}
            gunSelections={this.state.gunSelections}
          />
        </div>
        <div className="my-col">
          <GunAngleVisualizer
            shipItem={this.state.selectedShip}
            gunSelections={this.state.gunSelections}
            gunItems={this.props.gunItems}
          />
        </div>
      </div>
    );
  }
}

class ShipInputGroup extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  render() {
    const shipOptions = [];
    for (const shipItem of this.props.shipItems) {
      shipOptions.push(<option>{shipItem.Name}</option>);
    }

    return (
      <div className="ship-input my-col">
        <div>
          <div class="my-col">
            <input type="text" class="form-control name-input" placeholder="Build Name" autocomplete="off" onChange={this.props.nameChanged} />
            <div class="input-group ship-select-group">
              <div class="input-group-prepend">
                <div class="input-group-text">Ship</div>
              </div>
              <select class="form-control" onChange={this.props.shipChanged}>
                {shipOptions}
              </select>
            </div>
          </div>
          <div class="my-col">
            <div class="input-group">
              <button class="btn btn-info" type="button">Copy build link</button>
            </div>
          </div>
        </div>


        <div class="form-check">
          <input type="checkbox" class="form-check-input" id="shipBuilderPvECheck" autocomplete="off" />
          <label class="form-check-label" for="shipBuilderPvECheck">Use PvE equipment</label>
        </div>
        <div class="form-check">
          <input type="checkbox" class="form-check-input" id="staminaCheck" autocomplete="off" />
          <label class="form-check-label" for="staminaCheck">Show gunner stamina arcs</label>
        </div>


        <WeaponSelector
          gunChanged={this.props.gunChanged}
          ammoChanged={this.props.ammoChanged}
          gunItems={this.props.gunItems}
          ammoItems={this.props.ammoItems}
          selectedShip={this.props.selectedShip}
        />

      </div>
    )
  }
}

class WeaponSelector extends React.PureComponent {
  render() {
    const selectors = [];
    for (let i = 0; i < this.props.selectedShip.GunCount; i++) {
      selectors.push(<GunAmmoSelector {...this.props} gunIndex={i}></GunAmmoSelector>)
    }
    return (
      <div className="weapon-selector">
        <b>Ship Loadout</b>
        {selectors}
      </div>
    )
  }
}

class GunAmmoSelector extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  gunChanged = (evt) => {
    this.props.gunChanged(evt, this.props.gunIndex);
  }

  ammoChanged = (evt) => {
    this.props.ammoChanged(evt, this.props.gunIndex);
  }

  render() {
    const gunOptions = [];
    gunOptions.push(<option>None</option>);
    for (const gunItem of this.props.gunItems) {
      gunOptions.push(<option>{gunItem.Name}</option>);
    }
    const ammoOptions = [];
    ammoOptions.push(<option>None</option>);
    for (const ammoItem of this.props.ammoItems) {
      ammoOptions.push(<option>{ammoItem.Name}</option>);
    }
    return (
      <div class="input-group">
        <div class="input-group-prepend">
          <div class="input-group-text">Weapon {this.props.gunIndex + 1}</div>
        </div>
        <select class="form-control" onChange={this.gunChanged}>
          {gunOptions}
        </select>
        <select class="form-control" onChange={this.ammoChanged}>{ammoOptions}</select>
      </div>
    )
  }
}

class ShipStatBox extends React.PureComponent {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="ship-stats-box">
        <table className="ship-stats-table">
          <tr>
            <th>Armor: </th>
            <td></td>
          </tr>
          <tr>
            <th>Hull: </th>
            <td></td>
          </tr>
          <tr className="spacer"></tr>
          <tr>
            <th>Speed: </th>
            <td></td>
          </tr>
          <tr>
            <th>Acceleration: </th>
            <td></td>
          </tr>
          <tr className="spacer"></tr>
          <tr>
            <th>Vert Speed: </th>
            <td></td>
          </tr>
          <tr>
            <th>Vert Acceleration: </th>
            <td></td>
          </tr>
          <tr className="spacer"></tr>
          <tr>
            <th>Turn Speed: </th>
            <td></td>
          </tr>
          <tr>
            <th>Turn Acceleration:&nbsp;&nbsp;</th>
            <td></td>
          </tr>
          <tr className="spacer"></tr>
          <tr>
            <th>Mass: </th>
            <td></td>
          </tr>
        </table>
      </div>
    )
  }
}