
import { Slider } from '/React/Slider.js';
import { SliderTimelineBackground } from '/React/MatchHistory/SliderBackground.js';

const MAP_IMAGES = {
  66: "images/map-images/Fjords.jpg",
  // 314: "Derelict"
  80: "images/map-images/Paritan.jpg",
  289: "images/map-images/Thornholtjpg.jpg",
  126: "images/map-images/Water_Hazard.jpg"
}

const MAP_SCALE = {
  66: 0.236,
  80: 472 / 1000,
  126: 609/2000,

  289: 472 / 1500,
}

const MAP_OFFSET = {
  // (-1014.6 : 2001.5) => (790, 586)
  // __: {x: __ - -__ * MAP_SCALE[__], z: __ + __ * MAP_SCALE[__]},
  // __: {x: p_x - w_x * MAP_SCALE[__], z: p_z + w_z * MAP_SCALE[__]},
  66: { x: 790 - -1014.6 * MAP_SCALE[66], z: 586 + 2001.5 * MAP_SCALE[66] },
  80: { x: 166 - -942.5 * MAP_SCALE[80], z: 528 + -68.3 * MAP_SCALE[80] },
  126: {x: 220 - -2082.9 * MAP_SCALE[126], z: 308 + 2961.9 * MAP_SCALE[126]},

  289: { x: 166 - -942.5 * MAP_SCALE[80]-300, z: 528 + -68.3 * MAP_SCALE[80] + 50 },
}

function positionToCanvasPixel(worldPoint, mapId, canvasWidth){
  if (typeof worldPoint == 'string') 
    worldPoint = JSON.parse(worldPoint);
  const imageBaseWidth = 990;
  const imageScale = canvasWidth / imageBaseWidth;
  let offsets = MAP_OFFSET[mapId];
  let pxPerMeter = MAP_SCALE[mapId];
  if (!offsets) {
    offsets = [0, 0];
    pxPerMeter = 1;
  }
  const pixelPosition = [
    (worldPoint[0] * pxPerMeter + offsets.x) * imageScale,
    (-worldPoint[2] * pxPerMeter + offsets.z) * imageScale,
    0.1
  ];
  return pixelPosition;
}

function getDeaths(positionData) {
  // Return an array of the second ships died at and their team index.
  const deaths = [];
  for (const shipPositions of positionData) {
    for (let i = 0; i < shipPositions.Position.length; i++) {
      if (shipPositions.Dead[i]) {
        deaths.push({
          position: JSON.parse(shipPositions.Position[i]),
          timestamp: shipPositions.Timestamp[i],
          teamIdx: shipPositions.TeamIdx,
          shipIdx: shipPositions.ShipIdx,
        });
      }
    }
  }
  console.log(deaths);
  return deaths;
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
    // console.log("MAP: " + this.props.MapId);
    const response = await fetch(`/match/${this.props.MatchId}/positionData`);
    if (response.status != 200) {
      this.setState({ loading: false, noData: true });
      return;
    }
    const json = await response.json();
    console.log(json);
    // TODO: filter out fake ships.

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
    // console.log(this.props);
    // console.log(getDeaths(this.state.shipPositions));
    return (
      <div className="heatmap-tab">
        <Heatmap MapId={this.props.MapId} shipPositions={this.state.shipPositions} width={500} height={500}></Heatmap>
        <div className='settings'>
          Limit timespan
          <Slider>
            <SliderTimelineBackground matchTime={this.props.MatchTime} deaths={getDeaths(this.state.shipPositions)}></SliderTimelineBackground>
          </Slider>
        </div>
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

  componentDidMount() {
    // this.heatmap = simpleheat(this.canvasRef.current);

    // const data = this.getScaledPositions(this.props.shipPositions);
    let scaledPositions = [];
    const colors = ['red', 'orange', 'blue', 'cyan'];
    let colorsI = [];
    let a = 0;
    for (const positions of this.props.shipPositions) {
      const paths = this.getScaledPositions(positions)
      scaledPositions = scaledPositions.concat(paths);
      for (let i = 0; i < paths.length; i++ ) {
        colorsI.push(colors.push(colors[a]))
      }
      a += 1;
    }

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

    let cIdx = 0;

    ctx.lineWidth = 2;

    for (const p of this.getDeathPositions(this.props.shipPositions)){
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(p[0], p[1], 10, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = 'black';
      ctx.beginPath();
      ctx.arc(p[0], p[1], 8, 0, 2 * Math.PI);
      ctx.fill();
    }
    // for (const positionData of this.props.shipPositions) { 
    // }
    

    for (const points of scaledPositions) {
      break;

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

