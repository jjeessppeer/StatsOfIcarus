import { ShipCanvas } from "/React/ShipBuilder/ShipCanvas2.js";
import { RangeVisualizer } from "/React/ShipBuilder/RangeVisualizer.js";
import { GunAngleVisualizer } from "/React/ShipBuilder/GunAngleVisualizer.js";
import { getSortedGunSlots } from '/React/ShipBuilder/ShipBuilderUtils.js'

export class ShipBuilder extends React.PureComponent {
  constructor(props) {
    super(props);

    // Load state from url.


    this.state = {
      name: "",
      selectedShip: this.props.shipItems[0].Id,
      gunSelections: [-1, -1, -1, -1, -1, -1],
      selectedAmmos: [-1, -1, -1, -1, -1, -1],
      pveEnabled: false,
      loadStateFromUrl: true
    }

    // Load state from url.
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('build_code')) {
      const buildCode = urlParams.get('build_code');
      const decoded = LZString.decompressFromEncodedURIComponent(buildCode);
      const loadedState = JSON.parse(decoded);
      for (const key in loadedState) {
        this.state[key] = loadedState[key];
      }
    }
  }

  componentDidUpdate() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams();
    urlParams.set('build_code', this.getExportString());
    updateQueryParams(urlParams);
  }

  getExportString() {
    let str = JSON.stringify({
      name: this.state.name,
      selectedShip: this.state.selectedShip,
      gunSelections: this.state.gunSelections,
      selectedAmmos: this.state.selectedAmmos,
      pveEnabled: this.state.pveEnabled
    });
    let encoded = LZString.compressToEncodedURIComponent(str);
    return encoded;
  }

  nameChanged = (evt) => {
    this.setState({
      name: evt.target.value
    });
  }

  shipChanged = (evt) => {
    const shipItem = this.props.shipItems.find(el => el.Name == evt.target.value);
    this.setState({
      selectedShip: shipItem.Id,
      gunSelections: [-1, -1, -1, -1, -1, -1],
      selectedAmmos: [-1, -1, -1, -1, -1, -1]
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
    selectedAmmos[idx] = evt.target.value;
    this.setState({
      selectedAmmos: selectedAmmos
    });
  }

  pveChanged = (evt) => {
    this.setState({
      pveEnabled: evt.target.checked
    })
  }

  render() {
    const shipModel = this.state.selectedShip;
    const selectedShipItem = this.props.shipItems.find(el => el.Id == this.state.selectedShip);
    const selectedAmmoItems = this.state.selectedAmmos.map(ammoId => this.props.ammoItems.find(el => el.Id == ammoId));
    const selectedGunItems = this.state.gunSelections.map(gunId => this.props.gunItems.find(el => el.Id == gunId));

    return (
      <div className="ship-builder">
        <h3>Ship builder</h3>
        <p>Build can be shared via the current URL.</p>

        <ShipInputGroup
          nameChanged={this.nameChanged}
          gunChanged={this.gunChanged}
          ammoChanged={this.ammoChanged}
          shipChanged={this.shipChanged}
          pveChanged={this.pveChanged}
          pveEnabled={this.state.pveEnabled}
          gunItems={this.props.gunItems}
          ammoItems={this.props.ammoItems}
          shipItems={this.props.shipItems}
          shipName={this.state.name}
          selectedShipItem={selectedShipItem}
          selectedGunItems={selectedGunItems}
          selectedAmmoItems={selectedAmmoItems}
        />
        <div className="my-col">
          <b>Drag or scroll to pan or zoom image.</b>
          <br></br>
          <ShipCanvas width='600' height='600'
            movable={true}
            shipItem={selectedShipItem}
            gunItems={this.props.gunItems}
            selectedAmmos={selectedAmmoItems}
            shipLoadout={this.state.gunSelections}
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
            shipItem={selectedShipItem}
            selectedGunItems={selectedGunItems}
            selectedAmmoItems={selectedAmmoItems}
          />
        </div>
        <div className="my-col">
          <GunAngleVisualizer
            shipItem={selectedShipItem}
            selectedGunItems={selectedGunItems}
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
      shipOptions.push(<option selected={shipItem.Id == this.props.selectedShipItem.Id}>{shipItem.Name}</option>);
    }

    return (
      <div className="ship-input my-col">
        <div>
          <div class="my-col">
            <input type="text" class="form-control name-input" placeholder="Build Name" onChange={this.props.nameChanged} value={this.props.shipName} />
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
        <div>
          <label>
            <input type="checkbox" checked={this.props.pveEnabled} onChange={this.props.pveChanged} />
            Use PvE equipment
          </label>
        </div>
        <div>
          <label>
            <input type="checkbox" />
            Show gunner stamina arcs
          </label>
        </div>

        <WeaponSelector
          gunChanged={this.props.gunChanged}
          ammoChanged={this.props.ammoChanged}
          gunItems={this.props.gunItems}
          ammoItems={this.props.ammoItems}
          selectedShipItem={this.props.selectedShipItem}
          selectedGunItems={this.props.selectedGunItems}
          selectedAmmoItems={this.props.selectedAmmoItems}
          pveEnabled={this.props.pveEnabled}
        />

      </div>
    )
  }
}

class WeaponSelector extends React.PureComponent {
  render() {
    const selectors = [];
    for (let i = 0; i < this.props.selectedShipItem.GunCount; i++) {
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
    const selectedGunItem = this.props.selectedGunItems[this.props.gunIndex];
    const selectedAmmoItem = this.props.selectedAmmoItems[this.props.gunIndex];
    const gunId = selectedGunItem ? selectedGunItem.Id : -1;
    const ammoId = selectedAmmoItem ? selectedAmmoItem.Id : -1;

    const gunSlots = getSortedGunSlots(this.props.selectedShipItem);

    const gunOptions = [];
    gunOptions.push(<option value={-1} selected={gunId == -1}>None</option>);
    for (const gunItem of this.props.gunItems) {
      if (!this.props.pveEnabled && !(gunItem.GameType & 1)) continue;
      if (gunItem.Size != gunSlots[this.props.gunIndex].Size) continue;
      gunOptions.push(<option value={gunItem.Id} selected={gunId == gunItem.Id}>{gunItem.Name}</option>);
    }
    const ammoOptions = [];
    ammoOptions.push(<option value={-1} selected={ammoId == -1}>None</option>);
    for (const ammoItem of this.props.ammoItems) {
      ammoOptions.push(<option value={ammoItem.Id} selected={ammoId == ammoItem.Id}>{ammoItem.Name}</option>);
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