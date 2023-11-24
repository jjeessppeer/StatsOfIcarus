export class Slider extends React.Component {
  static defaultProps = {
    min: 0,
    max: 100,
    startValue: [0,100]
  }

  constructor(props) {
    super(props);
    this.state = {
      range: [this.props.min, this.props.max],
      value: this.props.startValue,
      botPercentage: 0,
      topPercentage: 0,
      dragging: false,
      dragStartX: null,
      dragStartPercentage: null,
      dragTarget: null
    }
    this.containerRef = React.createRef();
    this.minHandle = React.createRef();
    this.maxHandle = React.createRef();
  }

  componentDidMount() {
    let botRange = this.getAllowedPercentageRange('min');
    let topRange = this.getAllowedPercentageRange('max');

    let botP = this.mapToRange(this.state.value[0], this.state.range, botRange);
    let topP = this.mapToRange(this.state.value[1], this.state.range, topRange);
    this.setState({
      botPercentage: botP,
      topPercentage: topP
    });
  }

  mapToRange(value, oldRange, newRange) {
    const oldSpan = oldRange[1] - oldRange[0];
    const newSpan = newRange[1] - newRange[0];
    let oldNormalised = 0;
    if (oldSpan != 0) {
      oldNormalised = (value - oldRange[0]) / oldSpan;
    }
    const newValue = newRange[0] + newSpan * oldNormalised;
    return newValue;
  }

  startDrag = (evt, target) => {
    if (this.state.dragging) return;
    let startVal;
    if (target == 'min') startVal = this.state.botPercentage;
    else startVal = this.state.topPercentage;
    this.setState((oldState) => ({
      dragging: true,
      dragStartX: evt.pageX,
      dragStartPercentage: startVal,
      dragTarget: target
    }));
  }

  getAllowedPercentageRange(target) {
    const pixelWidth = this.containerRef.current.offsetWidth;
    const topHandleWidth = this.maxHandle.current.offsetWidth / pixelWidth * 100;
    const botHandleWidth = this.minHandle.current.offsetWidth / pixelWidth * 100;
    let min = 0;
    let max = 100 - topHandleWidth;
    if (target == 'min') {
      max = this.state.topPercentage - botHandleWidth;
    }
    else if (target == 'max') {
      min = this.state.botPercentage + botHandleWidth;
    }
    return [min, max];
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

    let newSliderPercentage = this.state.dragStartPercentage + percentageDelta;

    // Clamp percentage to allowed range.
    let [minPercentage, maxPercentage] = this.getAllowedPercentageRange(this.state.dragTarget);
    newSliderPercentage = Math.min(maxPercentage, newSliderPercentage);
    newSliderPercentage = Math.max(minPercentage, newSliderPercentage);

    // Convert percentage to input value.
    let botP = this.state.botPercentage;
    let topP = this.state.topPercentage;
    if (this.state.dragTarget == 'min') botP = newSliderPercentage;
    else topP = newSliderPercentage;
    const topHandleWidth = this.maxHandle.current.offsetWidth / pixelWidth * 100;
    const botHandleWidth = this.minHandle.current.offsetWidth / pixelWidth * 100;
    let fullPercentage = 100 - topHandleWidth - botHandleWidth;
    let b = botP / fullPercentage;
    let t = (topP - topHandleWidth) / fullPercentage;
    let min = this.props.min + (this.props.max - this.props.min) * b;
    let max = this.props.min + (this.props.max - this.props.min) * t;
    
    this.setState({
      botPercentage: botP,
      topPercentage: topP,
      value: [min, max]
    });

  }

  render() {

    return (
      <div className="slider-container"
        ref={this.containerRef}
        onMouseMove={this.mouseMove}>
        <SliderHandle
          handleType={'min'}
          percentage={this.state.botPercentage}
          startDrag={this.startDrag}
          handleRef={this.minHandle}
        ></SliderHandle>
        <SliderHandle
          handleType={'max'}
          percentage={this.state.topPercentage}
          startDrag={this.startDrag}
          handleRef={this.maxHandle}
        ></SliderHandle>
        {/* <SliderHandle isMax={true} range={[0, 100]} min={this.state.botVal} max={this.state.max}></SliderHandle> */}
        {/* <div className="slider-handle left">

        </div>
        <div className="slider-handle right" onMouseMove={this.mouseMove}> */}

        {/* </div> */}
        {this.props.children}
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
    // if (this.props.handleType == 'max') {
    //   style = {right: `${this.state.value}%`}
    // }
    return (
      <div
        className="slider-handle"
        // onMouseMove={this.mouseMove}
        // onMouseOut={this.mouseOut}
        ref={this.props.handleRef}
        onMouseDown={(evt) => (this.props.startDrag(evt, this.props.handleType))}
        style={style}
      >
      </div>
    );
  }
}