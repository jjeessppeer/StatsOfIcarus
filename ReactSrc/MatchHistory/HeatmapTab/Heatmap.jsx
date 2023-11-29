
import { getDeaths, positionToCanvasPixel, MAP_IMAGES } from '/React/MatchHistory/HeatmapTab/HeatmapUtils.js';
import simpleheat from 'simpleheat';


export class Heatmap extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  drawShipPaths(ctx, positionData) {
    const colors = ['red', 'orange', 'blue', 'cyan'];
    for (const shipPositions of positionData) {
      let lastP;
      let startNewPath = true;
      for (let i = 0; i < shipPositions.Timestamp.length; i++) {
        const p = positionToCanvasPixel(shipPositions.Position[i], this.props.MapId, this.props.width);
        if (startNewPath) {
          ctx.beginPath();
          ctx.moveTo(p[0][0], p[0][1]);
          startNewPath = false;
        }
        else {
          const xc = (lastP[0] + p[0]) / 2;
          const yc = (lastP[1] + p[1]) / 2;
          ctx.quadraticCurveTo(lastP[0], lastP[1], xc, yc);
        }
        if (shipPositions.Dead[i]) {
          startNewPath = true;
        }
        lastP = p;

        if ((startNewPath && i != 0) || i == shipPositions.Timestamp.length - 1) {
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'white';
          ctx.stroke();
          ctx.lineWidth = 2;
          ctx.strokeStyle = colors[shipPositions.TeamIdx * 2 + shipPositions.ShipIdx];
          ctx.stroke();
        }
      }
    }
  }

  drawDeathPoints(ctx, positionData) {
    for (const shipPositions of positionData) {
      for (let i = 0; i < shipPositions.Timestamp.length; i++) {
        if (!shipPositions.Dead[i]) continue;
        const p = positionToCanvasPixel(shipPositions.Position[i], this.props.MapId, this.props.width);
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.arc(p[0], p[1], 10, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(p[0], p[1], 8, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  drawHeatmap(canvas, positionData) {
    const heatmapData = [];
    for (const shipPositions of positionData) {
      for (let i = 0; i < shipPositions.Timestamp.length; i++) {
        const p = positionToCanvasPixel(shipPositions.Position[i], this.props.MapId, this.props.width, this.props.heatmapStrength);
        heatmapData.push(p);
      }
    }
    const heat = simpleheat(canvas);
    heat.gradient({
      0.08: 'blue',
      0.6: 'cyan',
      0.7: 'lime',
      0.8: 'yellow',
      1.0: 'red'
    });
    heat.radius(this.props.heatmapRadius, this.props.heatmapBlur);
    heat.data(heatmapData);
    heat.draw(0);

  }

  redrawCanvas = () => {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.props.canvasType == 'heatmap') {
      ctx.save();
      this.drawHeatmap(canvas, this.props.shipPositions);
      ctx.restore();
    }
    else if (this.props.canvasType == 'paths') {
      this.drawShipPaths(ctx, this.props.shipPositions);
      this.drawDeathPoints(ctx, this.props.shipPositions);  
    }
    // 
    //   
  }

  componentDidUpdate() {
    this.redrawCanvas();
  }

  componentDidMount() {
    this.redrawCanvas();
  }

  render() {
    let imgSrc = MAP_IMAGES[this.props.MapId];
    if (imgSrc == undefined) {
      imgSrc = "images/map-images/Duel_at_Dawn.jpg";
    }

    return (
      <div className="heatmap-container">
        <img
          className="map-image"
          src={imgSrc}
          style={{
            width: `${this.props.width}px`,
            height: `${this.props.height}px`
          }}></img>
        <canvas className="heatmap" width={this.props.width} height={this.props.height} ref={this.canvasRef}></canvas>
      </div>
    )
  }
}