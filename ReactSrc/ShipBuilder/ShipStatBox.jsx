

export class ShipStatBox extends React.PureComponent {
    constructor(props) {
      super(props);
    }
    render() {
      let totalTorque = 0;
      let totalThrust = 0;
      for (const c_name in this.props.shipItem.Engines) {
        const engine = this.props.shipItem.Engines[c_name];
        const slot = this.props.shipItem.Slots[c_name];
        totalThrust += engine.MaxSpeed;
        totalTorque += engine.MaxSpeed * Math.abs(slot.Position.X);
      }
      const mass = this.props.shipItem.BaseSetting.HullWeight;
      const drag = this.props.shipItem.BaseSetting.Drag;
      const lift = this.props.shipItem.BaseSetting.Lift;
      const angularDrag = this.props.shipItem.BaseSetting.AngularDrag;
      const verticalDrag = this.props.shipItem.BaseSetting.VerticalDrag;

      const inertialBounds = this.props.shipItem.BaseSetting.InertialBoundsExtents;
      const momentOfInertia = mass * (inertialBounds.X * inertialBounds.X + inertialBounds.Y * inertialBounds.Y) / 5.0;

      const acceleration = totalThrust / mass;
      const speed = Math.sqrt(totalThrust / (222 * drag));

      const radialAcceleration = totalTorque / momentOfInertia;
      const turnAcceleration = radialAcceleration * 57.2957795;
      const turnSpeed = Math.sqrt(totalTorque * 57.2957795 / (444444.0 * angularDrag));

      const verticalAcceleration = lift / mass;
      const verticalSpeed = Math.sqrt(lift / (4444 * verticalDrag));

      return (
        <div className="ship-stats-box">
          <table className="ship-stats-table">
            <tr>
              <th>Armor: <span></span></th>
              <td>{this.props.shipItem.Armor}</td>
            </tr>
            <tr>
              <th>Hull: <span></span></th>
              <td>{this.props.shipItem.Health}</td>
            </tr>
            <tr className="spacer"></tr>
            <tr>
              <th>Speed: </th>
              <td>{speed.toPrecision(2)} m/s</td>
            </tr>
            <tr>
              <th>Acceleration: </th>
              <td>{acceleration.toPrecision(2)} m/s<sup>2</sup></td>
            </tr>
            <tr className="spacer"></tr>
            <tr>
              <th>Vert Speed: </th>
              <td>{verticalSpeed.toPrecision(2)} m/s</td>
            </tr>
            <tr>
              <th>Vert Acceleration: </th>
              <td>{verticalAcceleration.toPrecision(2)} m/s<sup>2</sup></td>
            </tr>
            <tr className="spacer"></tr>
            <tr>
              <th>Turn Speed:</th>
              <td>{turnSpeed.toPrecision(2)} m/s</td>
            </tr>
            <tr>
              <th>Turn Acceleration:</th>
              <td>{turnAcceleration.toPrecision(2)} deg/s<sup>2</sup></td>
            </tr>
            <tr className="spacer"></tr>
            <tr>
              <th>Mass: </th>
              <td>{this.props.shipItem.BaseSetting.HullWeight/1000} tons</td>
            </tr>
          </table>
        </div>
      )
    }
  }