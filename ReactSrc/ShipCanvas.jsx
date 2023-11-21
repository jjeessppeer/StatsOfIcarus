import { ship_image_srcs2, toShipImageCoordinates, spreadGunPositions } from '/js/MatchHistory/matchHistory.js';


export class ShipCanvas extends React.Component {
  static defaultProps = {
    height: 250,
    width: 250
  }
  constructor(props) {
    super(props);
    // this.state = {
    //   shipModel: props.shipModel,
    //   shipLoadout: props.shipLoadout,
    //   transform: [
    //     1, 0, 0,
    //     0, 1, 0,
    //     0, 0, 1]
    // };
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.drawShip(this.props.shipModel, this.props.shipLoadout, [
      1, 0, 0,
      0, 1, 0,
      0, 0, 1]);
    // this.timerId = setInterval(() => this.tick(), 1000);
  }

  // componentWillUnmount() {
  //   clearInterval(this.timerId);
  // }

  // componentDidUpdate() {
  //   this.drawShip(this.props.shipModel, this.props.shipLoadout, [
  //     1, 0, 0,
  //     0, 1, 0,
  //     0, 0, 1]);
  // }

  async drawShip(shipModel, shipLoadout, transform) {
    if (shipModel == -1) return;
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    const shipImage = await loadImageAsync(ship_image_srcs2[shipModel]);


    const shipItemRaw = await fetch(`/game-item/ship/${shipModel}`);
    const shipItem = await shipItemRaw.json();
    const gunPositions = shipItem.GunPositions;

    // Find gun bounding rectangle.
    let maxY, minY, minX, maxX;
    for (let i = 0; i < gunPositions.length; i++) {
      let [x, y] = gunPositions[i];
      if (minX == undefined || x < minX) minX = x;
      if (maxX == undefined || x > maxX) maxX = x;
      if (minY == undefined || y < minY) minY = y;
      if (maxY == undefined || y > maxY) maxY = y;
      // break;
    }
    // maxX = toShipImageCoordinates([maxX, 0], shipModel, shipImage)[0];
    // minX = toShipImageCoordinates([minX, 0], shipModel, shipImage)[0];
    maxY = toShipImageCoordinates([0, maxY], shipModel, shipImage)[1];
    minY = toShipImageCoordinates([0, minY], shipModel, shipImage)[1];

    let centerX = shipImage.width / 2
    // let centerX = (minX + maxX) / 2;
    let centerY = (minY + maxY) / 2;

    resetMatrix(transform);
    applyMatrix(ctx, transform);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    
    translateMatrix(transform, canvas.width / 2 - centerX, canvas.height / 2 - centerY);
    zoomMatrixAround(transform, canvas.width / 2, canvas.height / 2, 0.5);
    applyMatrix(ctx, transform);

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(shipImage, 0, 0);


    const inverseTransform = getInvertedMatrix(transform);
    const localMin = transformPointMatrix(0, 0, inverseTransform);
    const localMax = transformPointMatrix(canvas.width, canvas.height, inverseTransform);

    // const localX = []

    const iconSize = 100;
    // Spread close guns out from eachother 
    let adjustedGunPositions = [];
    for (let i = 0; i < gunPositions.length; i++) {
      let pos = toShipImageCoordinates(gunPositions[i], shipModel, shipImage);
      adjustedGunPositions.push(pos);
    }
    adjustedGunPositions = spreadGunPositions(
      adjustedGunPositions, iconSize, 10, 
      [localMin[0], localMax[0]], [localMin[1], localMax[1]]
    );
    // Draw gun icons.
    for (let i = 0; i < shipLoadout.length; i++) {
      let gunId = shipLoadout[i];
      if (gunId == -1) continue;
      if (gunId == 0) continue;
      let gunImage = await loadImageAsync(`/images/item-icons/item${gunId}.jpg`);

      // let [cx, cy] = toShipImageCoordinates(adjustedGunPositions[i], shipModel, shipImage);
      let [cx, cy] = adjustedGunPositions[i];
      ctx.drawImage(gunImage, cx - iconSize / 2, cy - iconSize / 2, iconSize, iconSize);

    }
  }

  render() {
    return (
      <canvas height={this.props.height} width={this.props.width} ref={this.canvasRef}></canvas>
    )
  }
}