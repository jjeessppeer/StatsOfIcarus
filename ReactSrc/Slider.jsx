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
      dragStartPercentage: null,
      dragTarget: null
    }
    this.containerRef = React.createRef();
    this.minHandle = React.createRef();
    this.maxHandle = React.createRef();
  }

  componentDidMount() {
    this.setValue(this.state.value);
  }

  startDrag = (evt, target) => {
    if (this.state.dragging) return;
    let startVal;
    if (target == 'min') startVal = this.state.botPercentage;
    else startVal = this.state.topPercentage;
    if (this.state.value[0] == this.state.value[1]) {
      target = 'unknown';
    }
    this.setState({
      dragging: true,
      dragStartX: evt.pageX,
      dragStartPercentage: startVal,
      dragTarget: target
    });
  }

  getAllowedPercentageRange(target) {
    const pixelWidth = this.containerRef.current.offsetWidth;
    const topHandleWidth = this.maxHandle.current.offsetWidth / pixelWidth * 100;
    const botHandleWidth = this.minHandle.current.offsetWidth / pixelWidth * 100;
    let min = 0 - botHandleWidth / 2;
    let max = 100 - topHandleWidth / 2;
    if (target == 'min')
      max = this.state.topPercentage;
    else if (target == 'max')
      min = this.state.botPercentage;
    // let min = 0;
    // let max = 100 - topHandleWidth;
    // if (target == 'min') {
    //   max = this.state.topPercentage - botHandleWidth;
    // }
    // else if (target == 'max') {
    //   min = this.state.botPercentage + botHandleWidth;
    // }
    return [min, max];
  }

  setValue(value) {
    const [min, max] = value;
    const pixelWidth = this.containerRef.current.offsetWidth;
    const topHandleWidth = this.maxHandle.current.offsetWidth / pixelWidth * 100;
    const botHandleWidth = this.minHandle.current.offsetWidth / pixelWidth * 100;
    let fullPercentage = 100 - topHandleWidth - botHandleWidth;
    let b = min / (this.props.min + (this.props.max - this.props.min));
    let t = max / (this.props.min + (this.props.max - this.props.min));
    let botP = b * fullPercentage - botHandleWidth / 2;
    let topP = t * fullPercentage + topHandleWidth * 1.5;
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
    
    // TODO: move most of this to render.
    // Convert pixels to percentage.
    const pixelDelta = evt.pageX - this.state.dragStartX;
    const pixelWidth = this.containerRef.current.offsetWidth;
    const percentageDelta = pixelDelta / pixelWidth * 100;
    let newSliderPercentage = this.state.dragStartPercentage + percentageDelta;

    // Allow for overlapping handles to be separated better.
    let dragTarget = this.state.dragTarget;
    if (this.state.dragTarget == 'unknown') {
      if (percentageDelta <= 0) dragTarget = 'min';
      else dragTarget = 'max';
    }

    // Clamp percentage to allowed range.
    let [minPercentage, maxPercentage] = this.getAllowedPercentageRange(dragTarget);
    newSliderPercentage = Math.min(maxPercentage, newSliderPercentage);
    newSliderPercentage = Math.max(minPercentage, newSliderPercentage);

    // Convert percentage to input value.
    let botP = this.state.botPercentage;
    let topP = this.state.topPercentage;
    if (dragTarget == 'min') botP = newSliderPercentage;
    else topP = newSliderPercentage;
    const topHandleWidth = this.maxHandle.current.offsetWidth / pixelWidth * 100;
    const botHandleWidth = this.minHandle.current.offsetWidth / pixelWidth * 100;
    // let fullPercentage = 100 - topHandleWidth - botHandleWidth;
    let fullPercentage = 100;
    let b = (botP + botHandleWidth / 2) / fullPercentage;
    let t = (topP + topHandleWidth / 2) / fullPercentage;
    let min = this.props.min + (this.props.max - this.props.min) * b;
    let max = this.props.min + (this.props.max - this.props.min) * t;
    this.setState({
      botPercentage: botP,
      topPercentage: topP,
      value: [min, max],
      dragTarget: dragTarget
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
        <SliderHandle
          handleType={'min'}
          percentage={this.state.botPercentage}
          startDrag={this.startDrag}
          handleRef={this.minHandle}
        />
        <SliderHandle
          handleType={'max'}
          percentage={this.state.topPercentage}
          startDrag={this.startDrag}
          handleRef={this.maxHandle}
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