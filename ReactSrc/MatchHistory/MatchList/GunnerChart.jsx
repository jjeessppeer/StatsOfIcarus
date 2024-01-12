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


export class GunnerChart extends React.Component {
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
  }

  componentDidMount() {
  }

  // componentWillUnmount() {
  // }

  // componentDidUpdate() {
  // }


  render() {
    return (
      <div>
        <div className="hello">hello</div>
        <ComposedChart
          width={500}
          height={400}
          data={this.state.chartData}
          margin={{
            top: 20,
            right: 80,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid stroke="#f5f5f5" />
          <Tooltip content={<CustomTooltip />} />
          {/* <Legend /> */}

          <XAxis dataKey="time" type="number" label={{ value: 'Index', position: 'insideBottomRight', offset: 0 }} />
          <YAxis unit="ms" type="number" label={{ value: 'Time', angle: -90, position: 'insideLeft' }} />
          <ZAxis type="number" dataKey="disables_n" range={[0, 100]} name="score" unit="km" />
          {/* <Scatter name="Disables" dataKey="damage" fill="red" /> */}
          <Scatter name="blue" dataKey="hits_accumulated" fill="blue" />
          <Line dataKey="idx" stroke="red" dot={false} activeDot={false} legendType="none" />

          <Line dataKey="hits_accumulated" stroke="blue" dot={false} activeDot={false} legendType="none" />
          {/* <Line dataKey="redLine" stroke="red" dot={false} activeDot={false} legendType="none" /> */}
        </ComposedChart>
      </div>

    )
  }
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`ShotIdx : ${payload[0].payload.idx}`}</p>
        <p className="intro">{`Hit: ${payload[0].payload.hits_accumulated > 0}`}</p>
        <p className="desc">{`Disables: ${payload[0].payload.disables}`}</p>
      </div>
    );
  }

  return null;
};