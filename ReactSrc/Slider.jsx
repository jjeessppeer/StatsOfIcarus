// TODO: slider positoning can be vastly simplified by using css translation.

export class Slider extends React.Component {
  static defaultProps = {
    min: 0,
    max: 100,
    startValue: undefined
  }

  constructor(props) {
    super(props);
    this.state = {
      range: [this.props.min, this.props.max],
      value: (this.props.startValue ? this.props.startValue : [this.props.min, this.props.max]),
      botPercentage: 0,
      topPercentage: 0,
      dragging: false,
      dragStartX: null,
      dragTarget: null
    }
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    this.setValue(this.state.value);
  }

  startDrag = (evt, target) => {
    if (this.state.dragging) return;
    if (this.state.value[0] == this.state.value[1]) {
      target = 'unknown';
    }
    this.setState({
      dragging: true,
      dragStartX: evt.pageX,
      dragTarget: target
    });
  }

  setValue(value) {
    const [min, max] = value;
    let b = min / (this.props.min + (this.props.max - this.props.min));
    let t = max / (this.props.min + (this.props.max - this.props.min));
    let botP = b * 100;
    let topP = t * 100;
    this.setState({
      value: [min, max],
      botPercentage: botP,
      topPercentage: topP
    });
  }

  mouseMove = (evt) => {
    if (!this.state.dragging) return;
    if (!(evt.nativeEvent.buttons & 1)) {
      this.setState({ dragging: false });
      return;
    }
    
    // Convert pixels to percentage.
    const pixelDelta = evt.pageX - this.state.dragStartX;
    const pixelWidth = this.containerRef.current.offsetWidth;
    const percentageDelta = pixelDelta / pixelWidth * 100;

    // Allow for overlapping handles to be separated.
    let dragTarget = this.state.dragTarget;
    if (this.state.dragTarget == 'unknown') {
      if (percentageDelta <= 0) dragTarget = 'min';
      else dragTarget = 'max';
    }

    let botP = this.state.botPercentage;
    let topP = this.state.topPercentage;
    if (dragTarget == 'min' || dragTarget == 'both') botP += percentageDelta;
    if (dragTarget == 'max' || dragTarget == 'both') topP += percentageDelta;
    botP = Math.min(Math.max(botP, 0), this.state.topPercentage);
    topP = Math.min(Math.max(topP, this.state.botPercentage), 100);

    // Convert percentage to input value.
    let b = botP / 100;
    let t = topP / 100;
    let min = this.props.min + (this.props.max - this.props.min) * b;
    let max = this.props.min + (this.props.max - this.props.min) * t;
    this.setState({
      botPercentage: botP,
      topPercentage: topP,
      value: [min, max],
      dragTarget: dragTarget,
      dragStartX: evt.pageX,
    }, this.valueChanged);
  }

  valueChanged = () => {
    if (!this.props.valueChanged) return;
    this.props.valueChanged(this.state.value);
  }

  render() {
    return (
      <div className="slider-container" ref={this.containerRef} onMouseMove={this.mouseMove}>
        {this.props.children}
        <div className="slider-range" 
          style={{
            left: `${this.state.botPercentage}%`,
            right: `${100-this.state.topPercentage}%`
          }}
          onMouseDown={(evt) => (this.startDrag(evt, 'both'))}
        />
        <SliderHandle
          handleType={'min'}
          percentage={this.state.botPercentage}
          startDrag={this.startDrag}
        />
        <SliderHandle
          handleType={'max'}
          percentage={this.state.topPercentage}
          startDrag={this.startDrag}
        />
      </div>
    );
  }
}

export class SliderHandle extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    let style = { left: `${this.props.percentage}%` };
    return (
      <div
        className={"slider-handle " + (this.props.handleType)}
        ref={this.props.handleRef}
        onMouseDown={(evt) => (this.props.startDrag(evt, this.props.handleType))}
        style={style}
      >
      </div>
    );
  }
}