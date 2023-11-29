
import { getDeaths, positionToCanvasPixel, MAP_IMAGES } from '/React/MatchHistory/HeatmapTab/HeatmapUtils.js';

export class Heatmap extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.canvasRef2 = React.createRef();
  }


  getPaths(shipPositions) {
    const paths = [];
    const positions = shipPositions.Position;
    let currentPath;
    for (let i = 0; i < positions.length; i++) {
      if (i == 0 || shipPositions.Dead[i - 1]) {
        paths.push([]);
        currentPath = paths[paths.length - 1];
      }
      currentPath.push(positionToCanvasPixel(positions[i], this.props.MapId, this.props.width));
      // pixelPositions.push(positionToCanvasPixel(positions[i], this.props.MapId, this.props.width));
      // if (positionData.Dead != undefined && positionData.Dead[i]){
      //   paths.push(pixelPositions.slice());
      //   pixelPositions = [];
      // }
    }
    return paths;
  }

  // getScaledPositions(positionData) {
  //   const positions = positionData.Position;

  //   const paths = [];
  //   let pixelPositions = [];
  //   for (let i = 0; i < positions.length; i++) {
  //     pixelPositions.push(positionToCanvasPixel(positions[i], this.props.MapId, this.props.width));
  //     // if (positionData.Dead != undefined && positionData.Dead[i]){
  //     //   paths.push(pixelPositions.slice());
  //     //   pixelPositions = [];
  //     // }
  //   }
  //   // console.log(positions[0] + " => " + pixelPositions[0]);
  //   paths.push(pixelPositions.slice());
  //   return paths;
  // }

  getDeathPositions(positionData) {
    const positions = positionData.Position;
    const points = [];
    const deaths = getDeaths(positionData);
    for (const death of deaths) {
      points.push(positionToCanvasPixel(death.position, this.props.MapId, this.props.width))
    }
    // for (let i = 0; i < positions.length; i++) {
    //   if (positionData.Dead[i]){
    //     points.push(positionToCanvasPixel(positions[i], this.props.MapId, this.props.width))
    //   }
    // }
    return points;
  }

  drawSmoothCurve(points, ctx) {

  }

  redrawCanvas = () => {

    const canvas = this.canvasRef2.current;
    const ctx = canvas.getContext("2d");
    // ctx.reset();
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = ['red', 'orange', 'blue', 'cyan'];

    // Draw ship paths
    for (const shipPositions of this.props.shipPositions) {
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

    // Draw death points.
    for (const shipPositions of this.props.shipPositions) {
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




    // for (const p of this.getDeathPositions(this.props.shipPositions)) {
    //   ctx.fillStyle = 'white';
    //   ctx.beginPath();
    //   ctx.arc(p[0], p[1], 10, 0, 2 * Math.PI);
    //   ctx.fill();

    //   ctx.fillStyle = 'black';
    //   ctx.beginPath();
    //   ctx.arc(p[0], p[1], 8, 0, 2 * Math.PI);
    //   ctx.fill();
    // }
  }

  componentDidUpdate() {
    this.redrawCanvas();
  }

  componentDidMount() {
    this.redrawCanvas();
    return;
    // this.heatmap = simpleheat(this.canvasRef.current);

    // const data = this.getScaledPositions(this.props.shipPositions);


    // console.log(data);
    // this.heatmap.data(data);
    // this.heatmap.max(1);
    // this.heatmap.radius(10, 0)
    // this.heatmap.gradient({
    //   0: 'rgba(0, 0, 0, 0.1)', 
    //   0.1: 'rgba(255, 0, 0, 0.1)', 
    //   0.99: 'rgba(255, 0, 0, 0.1)'});
    // this.heatmap.draw();


    // for (const positionData of this.props.shipPositions) { 
    // }




  }

  render() {
    let imgSrc = MAP_IMAGES[this.props.MapId];
    if (imgSrc == undefined) {
      imgSrc = "images/map-images/Duel_at_Dawn.jpg";
    }
    // const imgSrc = `images/map-images/${}`

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
        <canvas className="heatmap" width={this.props.width} height={this.props.height} ref={this.canvasRef2}></canvas>
      </div>
    )
  }
}