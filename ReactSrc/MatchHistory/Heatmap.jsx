const {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Scatter,
  LineChart,
  Bar
} = window.Recharts;

function translateWorldPointToMap(x, y, z) {
  // + 23,23

  const mPerPx = 472/2000;
  return [x*mPerPx, y*mPerPx, z];
}

export class HeatmapTab extends React.Component {
  //   static defaultProps = {
  //     height: 250,
  //     width: 250
  //   }
  constructor(props) {
    super(props);
    this.state = {
      chartData: []
    };
    // this.state = { 
    //     sourceSelection: [] 
    // };
    this.canvasRef = React.createRef();
    this.heatmap = null;
  }

  componentDidMount() {
    this.heatmap = simpleheat(this.canvasRef.current);
    this.heatmap.data([
      [0, 0, 1],
      [0, 100, 0],
      [100, 0, 0],
      [200, 200, 0.3],
      [200, 200, 0.3],
      [200, 200, 0.3],
      [200, 200, 0.3],
      [200, 200, 0.3],
      [200, 200, 0.3],
    ]);
    this.heatmap.max(1);
    this.heatmap.radius(25, 15)
    this.heatmap.gradient({0: 'red', 0.5: 'lime', 0.8: 'red'});
    this.heatmap.draw();
  }

  componentWillUnmount() {
  }

  // componentDidUpdate() {
  // }


  render() {
    return (
      <div className="">
        <div className="map-container">
          <img className="map-image" src="images/map-images/Canyons.jpg"></img>
          <canvas className="heatmap" width="400" height="400" ref={this.canvasRef}></canvas>
        </div>
      </div>

    )
  }
}

function drawShipPath(canvas) {

}
