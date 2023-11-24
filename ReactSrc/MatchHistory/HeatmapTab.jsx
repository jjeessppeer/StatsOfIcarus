
const MAP_IMAGES = {
  66: "images/map-images/Fjords.jpg",
  // 314: "Derelict"
  80: "images/map-images/Paritan.jpg"
}

const MAP_SCALE = {
  66: 0.236,
  80: 472 / 1000,
}

const MAP_OFFSET = {
  // (-1014.6 : 2001.5) => (790, 586)
  // __: {x: __ - -__ * MAP_SCALE[__], z: __ + __ * MAP_SCALE[__]},
  // __: {x: p_x - -w_x * MAP_SCALE[__], z: p_z + w_z * MAP_SCALE[__]},
  66: { x: 790 - -1014.6 * MAP_SCALE[66], z: 586 + 2001.5 * MAP_SCALE[66] },
  80: { x: 166 - -942.5 * MAP_SCALE[80], z: 528 + -68.3 * MAP_SCALE[80] }
}


export class HeatmapTab extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      shipPositions: [],
      noData: true,
      loading: true
    }

    this.fetchData();
  }


  async fetchData() {
    console.log(this.props.MapItem[0]);
    console.log("MAP: " + this.props.MapId);
    const response = await fetch(`/match/${this.props.MatchId}/positionData`);
    if (response.status != 200) {
      this.setState({ loading: false, noData: true });
      return;
    }
    const json = await response.json();
    console.log(json);
    this.setState({
      loading: false,
      noData: false,
      shipPositions: json
    });
  }


  render() {
    if (this.state.loading) {
      return (<div></div>)
    }
    if (this.state.noData) {
      return (<div>No position data for match.</div>)
    }
    return (
      <div>
        <Heatmap MapId={this.props.MapId} shipPositions={this.state.shipPositions} width={500} height={500}></Heatmap>
      </div>
    );
  }
}

class Pathmap extends React.Component {

}

class Heatmap extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.canvasRef2 = React.createRef();
  }


  positionToCanvasPixel(position){
    if (typeof position == 'string') 
      position = JSON.parse(position);
    const imageBaseWidth = 990;
    const imageScale = this.props.width / imageBaseWidth;
    const offsets = MAP_OFFSET[this.props.MapId];
    const pxPerMeter = MAP_SCALE[this.props.MapId];
    const pixelPosition = [
      (position[0] * pxPerMeter + offsets.x) * imageScale,
      (-position[2] * pxPerMeter + offsets.z) * imageScale,
      0.1
    ];
    return pixelPosition;
  }

  getScaledPositions(positionData) {
    const positions = positionData.Position;

    const paths = [];
    let pixelPositions = [];
    for (let i = 0; i < positions.length; i++) {
      pixelPositions.push(this.positionToCanvasPixel(positions[i]));
      if (positionData.Dead != undefined && positionData.Dead[i]){
        paths.push(pixelPositions.slice());
        pixelPositions = [];
      }
    }
    // console.log(positions[0] + " => " + pixelPositions[0]);
    paths.push(pixelPositions.slice());
    return paths;
  }

  drawSmoothCurve(points, ctx) {
    
  }

  componentDidMount() {
    // this.heatmap = simpleheat(this.canvasRef.current);

    // const data = this.getScaledPositions(this.props.shipPositions);
    console.log("MOUNTED")
    let scaledPositions = [];
    for (const positions of this.props.shipPositions) {
      const paths = this.getScaledPositions(positions)
      scaledPositions = scaledPositions.concat(paths);
      console.log("Paths added")
      console.log(paths)
      console.log(scaledPositions)
    }
    console.log(scaledPositions);

    // console.log(data);
    // this.heatmap.data(data);
    // this.heatmap.max(1);
    // this.heatmap.radius(10, 0)
    // this.heatmap.gradient({
    //   0: 'rgba(0, 0, 0, 0.1)', 
    //   0.1: 'rgba(255, 0, 0, 0.1)', 
    //   0.99: 'rgba(255, 0, 0, 0.1)'});
    // this.heatmap.draw();

    const canvas = this.canvasRef2.current;
    const ctx = canvas.getContext("2d");
    ctx.globalCompositeOperation = 'source-over';

    const colors = ['red', 'orange', 'blue', 'cyan'];
    let cIdx = 0;

    ctx.lineWidth = 2;

    for (const points of scaledPositions) {
      

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
      ctx.strokeStyle = colors[cIdx];
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

  render() {
    let imgSrc = MAP_IMAGES[this.props.MapId];
    console.log(MAP_IMAGES);
    console.log(this.props.MapId);
    console.log("MAPPO: " + imgSrc);
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

