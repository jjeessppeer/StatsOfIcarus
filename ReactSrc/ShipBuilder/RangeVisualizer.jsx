import { getAmmoEffect, getGunParam } from '/React/DamageCalculator/DamageCalculator.js';
import { getSortedGunSlots } from '/React/ShipBuilder/ShipBuilderUtils.js'

export class RangeVisualizer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.drawCanvas();
  }

  componentDidUpdate() {
    this.drawCanvas();
  }

  drawCanvas() {
    let canvas = this.canvasRef.current;
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pad_left = (canvas.width - 500) / 2 + 0.5;
    const pad_top = 80.5;
    let [bw, bh] = [500, 500]//[canvas.width-pad_left-pad_right, canvas.height-pad_bot-pad_top];

    // Find longest range in different directions
    // TODO: this looks pretty fucked up.
    let front_range = 500;
    let back_range = 500;
    let side_range = 500;
    const gunSlots = getSortedGunSlots(this.props.shipItem);
    for (let i = 0; i < this.props.shipItem.GunCount; i++) {
      const gunItem = this.props.selectedGunItems[i];
      const ammoItem = this.props.selectedAmmoItems[i];
      const gunSlot = gunSlots[i];
      if (!gunItem) continue;

      const range = gunItem.Range * getAmmoEffect("ModifyProjectileSpeed", ammoItem) * getAmmoEffect("ModifyLifetime", ammoItem);
      let side_angle = degToRad(gunItem.MaxYaw);
      let initial_angle = degToRad(gunSlot.Angle);

      let diff_front = angleDifference(initial_angle, 0);
      let diff_back = angleDifference(initial_angle, Math.PI);
      let diff_side = Math.min(angleDifference(initial_angle, Math.PI / 2), angleDifference(initial_angle, -Math.PI / 2));

      if (diff_front < side_angle) front_range = Math.max(front_range, range);
      else {
        let angle_diff = Math.min(angleDifference(initial_angle - side_angle, 0), angleDifference(initial_angle + side_angle, 0))
        front_range = Math.max(Math.cos(angle_diff) * range, front_range);
      }
      if (diff_back < side_angle) back_range = Math.max(back_range, range);
      else {
        let angle_diff = Math.min(angleDifference(initial_angle - side_angle, Math.PI), angleDifference(initial_angle + side_angle, Math.PI))
        back_range = Math.max(Math.cos(angle_diff) * range, back_range);
      }
      if (diff_side < side_angle) side_range = Math.max(side_range, range);
      else {
        let angle_diff = Math.min(angleDifference(initial_angle + side_angle, Math.PI / 2), angleDifference(initial_angle - side_angle, -Math.PI / 2));
        side_range = Math.max(Math.abs(Math.cos(angle_diff) * range), side_range);
      }
    }
    front_range = Math.ceil(front_range / 500) * 500;
    back_range = Math.ceil(back_range / 500) * 500;
    side_range = Math.ceil(side_range / 500) * 500;
    while (front_range + back_range < side_range * 2) {
      front_range += 500;
      // if (added_front) front_range += 500;
      // else back_range += 500;
      // added_front = !added_front;
    }
    if ((front_range + back_range) % 1000 != 0) front_range += 500;

    let scale = bh / (front_range + back_range);
    let size = front_range + back_range;

    // Draw background graph
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    // if (dark_mode) {
    //   ctx.fillStyle = "#ffffff";
    //   ctx.strokeStyle = "#ffffff";
    // }
    ctx.beginPath();
    ctx.font = "15px Arial";
    ctx.textAlign = "center";
    for (var x = 0; x <= size; x += 500) {
      ctx.moveTo(x * scale + pad_left, pad_top);
      ctx.lineTo(x * scale + pad_left, bh + pad_top);
      ctx.fillText(precise(x - size / 2, 2), x * scale + pad_left, bh + pad_top + 16);
    }

    ctx.textAlign = "end";
    for (var x = 0; x <= size; x += 500) {
      ctx.moveTo(pad_left, x * scale + pad_top);
      ctx.lineTo(bw + pad_left, x * scale + pad_top);
      ctx.fillText(precise(size - x - size * (back_range / (front_range + back_range)), 2), pad_left - 2, x * scale + pad_top + 5);
    }
    ctx.setLineDash([1, 4]);
    ctx.stroke();

    // Draw box around
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.rect(pad_left, pad_top, bw, bh);
    ctx.stroke();

    // Draw title
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(this.props.shipItem.Name, canvas.width / 2, 20);

    // Draw gun descriptions
    let gun_descriptions = [];
    let colors_tmp = [];
    for (let i = 0; i < this.props.shipItem.GunCount; i++) {
      const gunItem = this.props.selectedGunItems[i];
      if (!gunItem) continue;
      const ammoItem = this.props.selectedAmmoItems[i];
      let ammoName;
      if (ammoItem) ammoName = ammoItem.Name;
      else ammoName = "Normal";
      gun_descriptions.push(gunItem.Name + "(" + ammoName + ")");
      colors_tmp.push(gun_colors[i])
    }
    ctx.textAlign = "left";
    let text_width_1 = ctx.measureText(gun_descriptions.slice(0, 3).join(" ")).width;
    let text_width_2 = ctx.measureText(gun_descriptions.slice(3, 6).join(" ")).width;
    let left_x_1 = canvas.width / 2 - text_width_1 / 2;
    let left_x_2 = canvas.width / 2 - text_width_2 / 2;

    for (let i = 0; i < gun_descriptions.length; i++) {
      ctx.fillStyle = colors_tmp[i];
      if (i >= 3) {
        ctx.fillText(gun_descriptions[i], left_x_2, 62);
        left_x_2 += ctx.measureText(gun_descriptions[i] + " ").width;
      }
      else {
        ctx.fillText(gun_descriptions[i], left_x_1, 40);
        left_x_1 += ctx.measureText(gun_descriptions[i] + " ").width;
      }
    }

    // Draw gun arcs
    let cx = pad_left + scale * size / 2;
    let cy = pad_top + scale * (size - size * (back_range / (front_range + back_range)));

    for (let i = 0; i < this.props.shipItem.GunCount; i++) {
      const gunItem = this.props.selectedGunItems[i];
      if (!gunItem) continue;
      const ammoItem = this.props.selectedAmmoItems[i];

      const range = gunItem.Range * getAmmoEffect("ModifyProjectileSpeed", ammoItem) * getAmmoEffect("ModifyLifetime", ammoItem);
      const side_angle = degToRad(gunItem.MaxYaw);
      const initial_angle = degToRad(-90 + gunSlots[i].Angle);

      // let range = gun_numbers.info.range;
      // let side_angle = degToRad(gun_numbers.info.angle);
      // let initial_angle = -Math.PI / 2 + degToRad(parseFloat(ship_data[2 + i]));

      // let [gx, gy] = pointStringToInts(ship_data[8+i])
      // gx = cx + gx*scale;
      // gy = cy + gy*scale;
      let [gx, gy] = [cx, cy];

      ctx.strokeStyle = gun_colors[i];
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.arc(gx, gy, range * scale, initial_angle - side_angle, initial_angle + side_angle);
      ctx.lineTo(gx, gy);
      ctx.stroke();

      ctx.setLineDash([10, 4, 1, 4]);
      ctx.beginPath();
      ctx.moveTo(gx, gy);
      ctx.lineTo(gx + range * scale * Math.cos(initial_angle), gy + range * scale * Math.sin(initial_angle));
      ctx.stroke();

    }

  }

  render() {
    return (
      <canvas class="range-canvas" width="600" height="600" ref={this.canvasRef}></canvas>
    )
  }
}


var gun_colors = ["#e6194B", "#f58231", "#3cb44b", "#4363d8", "#911eb4", "#808000"];