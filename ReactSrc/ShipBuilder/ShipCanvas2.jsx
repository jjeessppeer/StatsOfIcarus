import { ship_image_srcs2, toShipImageCoordinates, spreadGunPositions } from '/js/MatchHistory/matchHistory.js';
import { getAmmoEffect, getGunParam } from '/React/DamageCalculator/DamageCalculator.js';
import { getSortedGunSlots } from '/React/ShipBuilder/ShipBuilderUtils.js'

export class ShipCanvas extends React.Component {
  static defaultProps = {
    height: 250,
    width: 250,
    adjustGunSpacing: true
  }
  constructor(props) {
    super(props);
    this.state = {
      resetTransform: false,
      transform: [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
      ]
    }
    this.canvasRef = React.createRef();
    this.offCanvas = React.createRef();
  }

  static getDerivedStateFromProps(props, state) {
    if (props.shipItem !== state.shipItem) {
      return {
        shipItem: props.shipItem,
        resetTransform: true
      }
    }
    return {
      resetTransform: false
    }
  }

  componentDidUpdate() {
    this.drawShip(this.props.shipModel, this.props.shipLoadout, this.state.transform);
  }

  componentDidMount() {
    this.canvasRef.current.addEventListener('wheel', this.mouseScrolled, { passive: false });
    this.drawShip(this.props.shipModel, this.props.shipLoadout, this.state.transform);
  }

  componentWillUnmount() {
    this.canvasRef.current.removeEventListener('wheel', this.mouseScrolled);
  }

  mouseMoved = (evt) => {
    if (!this.props.movable) return;
    if (!(evt.nativeEvent.buttons & 1)) {
      return;
    }

    const transform = [...this.state.transform];
    let dx = evt.movementX;
    let dy = evt.movementY;
    dx /= transform[0];
    dy /= transform[4];
    translateMatrix(transform, dx, dy);
    this.setState({
      transform: transform
    })
  }

  mouseScrolled = (evt) => {
    if (!this.props.movable) return;
    evt.preventDefault();
    const rect = evt.target.getBoundingClientRect();
    const pos_x = evt.clientX - rect.left;
    const pos_y = evt.clientY - rect.top;
    const factor = (evt.deltaY < 0) ? 1.1 : 0.9;

    const transform = [...this.state.transform];
    zoomMatrixAround(transform, pos_x, pos_y, factor);
    this.setState({
      transform: transform
    });
  }

  async drawShip(shipModel, shipLoadout, transform) {
    if (shipModel == -1) return;

    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    const offscreen = this.offCanvas.current;
    const off_ctx = offscreen.getContext('2d');
    const shipImage = await loadImageAsync(ship_image_srcs2[shipModel]);

    const gunSlots = getSortedGunSlots(this.props.shipItem);
    const gunPositions = [];
    for (const slot of gunSlots) {
      const p = [slot.Position.X, slot.Position.Z];
      gunPositions.push(p);
    }

    ctx.reset();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.state.resetTransform) {
      // Focus transform on center of ship.
      let maxY, minY, minX, maxX;
      for (let i = 0; i < gunPositions.length; i++) {
        let [x, y] = gunPositions[i];
        if (minX == undefined || x < minX) minX = x;
        if (maxX == undefined || x > maxX) maxX = x;
        if (minY == undefined || y < minY) minY = y;
        if (maxY == undefined || y > maxY) maxY = y;
      }
      maxY = toShipImageCoordinates([0, maxY], shipModel, shipImage)[1];
      minY = toShipImageCoordinates([0, minY], shipModel, shipImage)[1];
      let centerX = shipImage.width / 2
      let centerY = (minY + maxY) / 2;
      resetMatrix(transform);
      translateMatrix(transform, canvas.width / 2 - centerX, canvas.height / 2 - centerY);
      zoomMatrixAround(transform, canvas.width / 2, canvas.height / 2, 1);
    }
    applyMatrix(ctx, transform);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(shipImage, 0, 0);

    const inverseTransform = getInvertedMatrix(transform);
    const localMin = transformPointMatrix(0, 0, inverseTransform);
    const localMax = transformPointMatrix(canvas.width, canvas.height, inverseTransform);

    const iconSize = 75;
    // Convert to pixel space
    let adjustedGunPositions = [];
    for (let i = 0; i < gunPositions.length; i++) {
      let pos = toShipImageCoordinates(gunPositions[i], shipModel, shipImage);
      adjustedGunPositions.push(pos);
    }
    if (this.props.adjustGunSpacing) {
      // Spread close guns out from eachother 
      adjustedGunPositions = spreadGunPositions(
        adjustedGunPositions, iconSize, 10,
        [localMin[0], localMax[0]], [localMin[1], localMax[1]]
      );
    }

    // Draw gun icons.
    for (let i = 0; i < adjustedGunPositions.length; i++) {
      let gunId = shipLoadout[i];
      let gunImage;
      if (gunId == -1) {
        gunImage = await loadImageAsync(`/images/gun-images/icons/None.jpg`);
      }
      else {
        gunImage = await loadImageAsync(`/images/item-icons/item${gunId}.jpg`);
      }

      // let [cx, cy] = toShipImageCoordinates(adjustedGunPositions[i], shipModel, shipImage);
      let [cx, cy] = adjustedGunPositions[i];
      ctx.drawImage(gunImage, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);
      ctx.fillStyle = "rgb(255, 255, 255)";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText(i + 1, cx, cy + 8);

      if (!this.props.renderGunArcs) continue;

      // Draw gun arcs
      const gunSlot = gunSlots[i];
      const gunItem = this.props.gunItems.find(el => el.Id == shipLoadout[i]);
      if (!gunItem) continue;
      const gun_angle = gunItem.MaxYaw;
      const angle = degToRad(-90 + parseFloat(gunSlot.Angle));
      const right_angle = angle + degToRad(gun_angle);
      const left_angle = angle - degToRad(gun_angle);

      const ammoItem = this.props.selectedAmmos[i];
      const range = gunItem.Range * getAmmoEffect("ModifyProjectileSpeed", ammoItem) * getAmmoEffect("ModifyLifetime", ammoItem);
      const muzzleSpeed = getGunParam("fMuzzleSpeed", gunItem, 1) * getAmmoEffect("ModifyProjectileSpeed", ammoItem);;
      const armingDelay = getGunParam("fArmingDelay", gunItem, 0) * getAmmoEffect("ModifyArmingTime", ammoItem);
      const armingDistance = muzzleSpeed * armingDelay;
      
      off_ctx.resetTransform();
      off_ctx.clearRect(0, 0, offscreen.width, offscreen.height);
      applyMatrix(off_ctx, transform);

      off_ctx.fillStyle = "rgb(50, 50, 50)";
      off_ctx.globalAlpha = 0.3;
      off_ctx.globalCompositeOperation = "source-over";

      off_ctx.beginPath();
      off_ctx.moveTo(cx, cy);
      off_ctx.arc(cx, cy, range/0.128, left_angle, right_angle);
      off_ctx.lineTo(cx, cy);
      off_ctx.fill();

      //Clear arc inside arming range, leave a bit at the edges
      off_ctx.globalAlpha = 1;
      off_ctx.globalCompositeOperation = "destination-out";
      off_ctx.beginPath();
      let cx2 = cx + Math.cos(angle) * 5;
      let cy2 = cy + Math.sin(angle) * 5;

      off_ctx.moveTo(cx2, cy2);
      off_ctx.arc(cx2, cy2, armingDistance/0.128, left_angle, right_angle);
      off_ctx.lineTo(cx2, cy2);
      off_ctx.fill();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(offscreen, 0, 0);
      ctx.restore();
    }

  }

  render() {
    return (
      <div className='ship-renderer'>
        <canvas className='ship-canvas' height={this.props.height} width={this.props.width}
          ref={this.canvasRef}
          onMouseMove={this.mouseMoved}
        >
        </canvas>
        <canvas className='off-canvas' height={this.props.height} width={this.props.width}
          ref={this.offCanvas}
        />
      </div>

    )
  }
}

// export function getSortedGunSlots(shipItem) {
//   const gunSlots = [];
//   for (let i = 0; i < shipItem.GunCount; i++) {
//     const key = `gun-slot-${i + 1}`;
//     const slot = shipItem.Slots[key];
//     gunSlots.push(slot);
//   }
//   gunSlots.sort((a, b) => {
//     if (a.Size == b.Size)
//       return (a.Position.Z != b.Position.Z ? b.Position.Z - a.Position.Z : b.Position.X - a.Position.X)
//     return b.Size - a.Size;
//   });
//   return gunSlots;
// }