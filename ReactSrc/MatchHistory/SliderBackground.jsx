
export class SliderTimelineBackground extends React.PureComponent {
  static defaultProps = {
    matchTime: 10 * 60,
    deaths: [[60000, 0], [120000, 1]],
    startValue: [0, 100]
  }

  constructor(props) {
    super(props);
  }

  render() {
    // const matchMinutes = this.props.matchTime / 60;
    const matchMinutes = 10;
    const notchWidth = 100 / matchMinutes;
    // const style = {
    //   background: `repeating-linear-gradient(90deg, 
    //     #e66465, 
    //     #e66465 calc(${notchWidth}% - 1.5px), 
    //     #9198e5 calc(${notchWidth}% - 1.5px), 
    //     #9198e5 ${notchWidth}%)`
    // }

    const style = {
      background: `repeating-linear-gradient(90deg, 
        var(--card-color-1), 
        var(--card-color-1) calc(${notchWidth}% - 1.5px), 
        var(--card-border) calc(${notchWidth}% - 1.5px), 
        var(--card-border) ${notchWidth}%)`
    }

    const deathMarkers = [];
    console.log("NW: ", notchWidth);
    console.log("Length: ", matchMinutes);
    for (const death of this.props.deaths) {
      console.log("Death min: ", death.timestamp/1000/60);
      const st = {
        left: `${notchWidth*death.timestamp/1000/60}%`,
        "background-color": (death.teamIdx == 0 ? 'var(--red-4)' : 'var(--blue-4)'),
      }
      deathMarkers.push(<div className="death-marker" style={st}></div>)
    }



    return (
      <div className={"slider-background"} style={style}>
        {deathMarkers}
      </div>
    );
  }
}