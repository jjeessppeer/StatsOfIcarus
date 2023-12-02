
import { getSortedGunSlots, GUN_COLORS } from '/React/ShipBuilder/ShipBuilderUtils.js'


export class GunAngleVisualizer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.imgRef = React.createRef();
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.drawCanvas();
    const outerWidth = this.imgRef.current.offsetWidth;
    const innerWidth = this.imgRef.current.parentNode.offsetWidth;
    this.imgRef.current.parentNode.scrollLeft = (outerWidth - innerWidth) / 2;
  }

  componentDidUpdate() {
    this.drawCanvas();
    const outerWidth = this.imgRef.current.offsetWidth;
    const innerWidth = this.imgRef.current.parentNode.offsetWidth;
    this.imgRef.current.parentNode.scrollLeft = (outerWidth - innerWidth) / 2;
  }

  drawCanvas() {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.3;

    const gunSlots = getSortedGunSlots(this.props.shipItem);
    for (let i=0; i < this.props.shipItem.GunCount; i++){
      const gunItem = this.props.selectedGunItems[i];
      if (!gunItem) continue;
      let side_angle = degToRad(gunItem.MaxYaw);
      let initial_angle = degToRad(gunSlots[i].Angle);
  
      let a_left = initial_angle - side_angle + Math.PI
      let a_right = initial_angle + side_angle + Math.PI
  
      let p_left = a_left * canvas.width / 2 / Math.PI
      let p_right = a_right * canvas.width / 2 / Math.PI
      ctx.fillStyle = GUN_COLORS[i];
      ctx.beginPath();
      ctx.rect(p_left, 0, p_right-p_left, canvas.height);
      ctx.fill();
    }
  }

  render() {
    const src = "images/helm-images/"+this.props.shipItem.Name+"_helm.jpg";
    // outerContent.scrollLeft((innerContent.width() - outerContent.width()) / 2);
    return (
      <div class="angle-visualizer" ref={this.div}>
        <img src={src} width="1650" height="720" ref={this.imgRef} />
        <canvas width="1650" height="720" ref={this.canvasRef}>Your browser does not support the HTML5 canvas tag.</canvas>
      </div>
    )
  }
}