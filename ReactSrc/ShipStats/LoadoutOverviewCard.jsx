import { ShipCanvas } from '/React/ShipCanvas.js'

export class ShipRatesBox extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const pickRate = this.props.picks / this.props.totalPicks;
    const matchRate = this.props.matches / this.props.totalMatches;
    const winRate = this.props.wins / this.props.picks;
    return (
      <div>
        <table className="ship-rates">
          <tr>
            <td>Pick rate:</td>
            <td>{pickRate * 100}% [{this.props.picks}]</td>
          </tr>
          <tr>
            <td>Win rate: </td>
            <td>{winRate * 100}% [{this.props.wins}]</td>
          </tr>
          <tr>
            <td>Match rate: </td>
            <td>{matchRate * 100}% [{this.props.matches}]</td>
          </tr>
        </table>
      </div>
    )
  }
}

export class ShipOverview extends React.Component {
  async componentDidMount() {
    
  }

  render() {
    return (
      <div className="ship-overview info-card">
        <div className="ship-overview-title">
          <img src="images/item-icons/ship16.png"></img>
          <div className="ship-overview-name"><a>Pyramidion</a></div>

        </div>
        <ShipRatesBox {...this.props.shipRates}></ShipRatesBox>
      </div>
    )
  }
}


export class ShipLoadoutInfoList extends React.Component {
  render() {
    const componentArray = [
    ]
    for (const loadoutInfo of this.props.loadoutInfos) {
      componentArray.push(<ShipLoadoutInfo loadoutInfo={loadoutInfo}></ShipLoadoutInfo>);
    }
    return (
      <ul>
        {componentArray}
      </ul>
    )
  }
}

// Render your React component instead
export class ShipLoadoutInfo extends React.Component {
  constructor(props) {
    super(props);
  }

  toggleTab(e) {

  }

  render() {

    const eq = JSON.parse(this.props.loadoutInfo._id);
    const model = eq[0].model;
    const guns = [-1, -1, -1, -1, -1, -1];
    for (const part of eq){
      if (part.G != undefined) {
        guns[part.G] = part.gun;
      }
    }


    const loadoutInfo = {
      shipModel: eq[0].model,
      shipLoadout: guns,
      gunPositions: [[7.34554, 21.6899], [-7.43765, 21.5997], [-8.15, 4.36], [8.15, 4.36], [6.1, 12.34], [-6.1, 12.34]]
    };

    const rateProps = { 
      picks: this.props.loadoutInfo.PlayedGames, 
      totalPicks: this.props.loadoutInfo.TotalGames, 
      matches: 4, 
      totalMatches: 5, 
      wins: this.props.loadoutInfo.Wins };
    return (
      <li className="ship-loadout-info info-card">
        <div className='content'>
          <ShipCanvas {...loadoutInfo} width='150' height='250'></ShipCanvas>
          <div>hello</div>
          <ShipRatesBox {...rateProps}></ShipRatesBox>

        </div>
        <div className='expand-button-bar'>
          <LoadoutExpandButton onExpand={this.toggleTab} name={'Strong against'}></LoadoutExpandButton>
          <LoadoutExpandButton onExpand={this.toggleTab} name={'Weak against'}></LoadoutExpandButton>
          <LoadoutExpandButton onExpand={this.toggleTab} name={'Strong with'}></LoadoutExpandButton>
          <LoadoutExpandButton onExpand={this.toggleTab} name={'Weak with'}></LoadoutExpandButton>
        </div>
      </li>

    )
  }
}

function LoadoutExpandButton(props) {
  return (
    <div class="loadout-expand-button">
      {props.name} <i class="fas fa-chevron-down">
      </i></div>
  )
}

// const root = ReactDOM.createRoot(document.getElementById('root'));
// const root = ReactDOM.createRoot(document.getElementById('ModInfobox'));
// root.render(<Clock />);
// root.render(React.createComponent);