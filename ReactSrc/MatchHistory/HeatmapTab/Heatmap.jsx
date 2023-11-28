
import { getDeaths, positionToCanvasPixel, MAP_IMAGES } from '/React/MatchHistory/HeatmapTab/HeatmapUtils.js';

export class Heatmap extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.canvasRef2 = React.createRef();
  }

  getScaledPositions(positionData) {
    const positions = positionData.Position;

    const paths = [];
    let pixelPositions = [];
    for (let i = 0; i < positions.length; i++) {
      pixelPositions.push(positionToCanvasPixel(positions[i], this.props.MapId, this.props.width));
      // if (positionData.Dead != undefined && positionData.Dead[i]){
      //   paths.push(pixelPositions.slice());
      //   pixelPositions = [];
      // }
    }
    // console.log(positions[0] + " => " + pixelPositions[0]);
    paths.push(pixelPositions.slice());
    return paths;
  }

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
    let scaledPositions = [];
    const colors = ['red', 'orange', 'blue', 'cyan'];
    let colorsI = [];
    let a = 0;
    for (const positions of this.props.shipPositions) {
      const paths = this.getScaledPositions(positions)
      scaledPositions = scaledPositions.concat(paths);
      for (let i = 0; i < paths.length; i++) {
        colorsI.push(colors[a])
      }
      a += 1;
    }
    const canvas = this.canvasRef2.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let cIdx = 0;

    ctx.lineWidth = 2;
    // console.log("Colors: ", colorsI);

    for (const p of this.getDeathPositions(this.props.shipPositions)) {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(p[0], p[1], 10, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(p[0], p[1], 8, 0, 2 * Math.PI);
      ctx.fill();
    }


    for (const points of scaledPositions) {
      // break;

      // Curve type 1
      // if (points.length <= 1) continue;
      // ctx.beginPath();
      // ctx.strokeStyle = colors[cIdx];
      // ctx.moveTo((points[0][0]), points[0][1]);

      // for(var i = 0; i < points.length-1; i ++)
      // {
      //   var x_mid = (points[i][0] + points[i+1][0]) / 2;
      //   var y_mid = (points[i][1] + points[i+1][1]) / 2;
      //   var cp_x1 = (x_mid + points[i][0]) / 2;
      //   var cp_x2 = (x_mid + points[i+1][0]) / 2;
      //   ctx.quadraticCurveTo(cp_x1,points[i][1] ,x_mid, y_mid);
      //   ctx.quadraticCurveTo(cp_x2,points[i+1][1], points[i+1][0], points[i+1][1]);
      // }

      // Curve type 2
      if (points.length <= 2) continue;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length - 2; i++) {
        var xc = (points[i][0] + points[i + 1][0]) / 2;
        var yc = (points[i][1] + points[i + 1][1]) / 2;
        ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
      }

      // curve through the last two points
      // console.log(points[points.length - 2])
      ctx.quadraticCurveTo(
        points[points.length - 1][0],
        points[points.length - 1][1],
        points[points.length - 2][0],
        points[points.length - 2][1]
      );

      ctx.lineWidth = 4;
      ctx.strokeStyle = 'white';
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = colorsI[cIdx];
      ctx.stroke();


      // for (const p of points) {
      //   ctx.fillStyle = 'white';
      //   ctx.beginPath();
      //   ctx.arc(p[0], p[1], 4, 0, 2 * Math.PI);
      //   ctx.fill();

      //   ctx.fillStyle = colors[cIdx];
      //   ctx.beginPath();
      //   ctx.arc(p[0], p[1], 3, 0, 2 * Math.PI);
      //   ctx.fill();
      // }

      cIdx += 1;
      // break;
    }
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