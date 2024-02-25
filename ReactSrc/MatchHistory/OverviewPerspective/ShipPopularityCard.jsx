import { getItem } from "/js/ItemFetcher.js";

export class ShipPopularityCard extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      matchCount: -1,
      shipWinrates: []
    };
  }

  componentDidMount() {
    this.fetchShipWinrates();
    
  }
  componentDidUpdate(prevProps) {
    if (JSON.stringify(prevProps) != JSON.stringify(this.props)) {
      this.fetchShipWinrates();
    }
  }

  fetchShipWinrates = async () => {
    console.log("Fetching ship popularity...")
    const response = await fetch('/ship_popularity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter: this.props.filter
      })
    });
    const json = await response.json();

    this.setState({
      matchCount: json.Count,
      shipWinrates: json.ModelWinrates
    });
  }

  render() {
    const popularityElements = [];
    for (const shipRates of this.state.shipWinrates) {
      popularityElements.push(<ShipPopularityElement 
        matchCount={this.state.matchCount} 
        shipRates={shipRates}
        />)
    }

    return (
      <div>
        <ul className="ship-popularity-list">
          {popularityElements}
        </ul>
      </div>
    );
  }
}


function ShipPopularityElement({matchCount, shipRates}) {
  const [shipItem, setShipItem] = React.useState(-1);
  
  React.useEffect(() => {
    const fetchData = async () => {
      const shipItem = await getItem("ship", shipRates._id);
      setShipItem(shipItem);
    }
    fetchData();
  }, [shipRates]);

  if (shipItem === -1) return;

  return (
    <li className="ship-popularity-element">
      <img src={`images/item-icons/${shipItem.IconPath}`} />
      <div class="shipname"><a>{shipItem.Name}</a></div>
      <div class="rates">
          <div class="shippopularity">
            {`Picked: ${(100 * shipRates.PlayedGames / matchCount).toPrecision(2)}% [${shipRates.PlayedGames}]`}
            </div>
          <div class="shipwins">
            {`Winrate: ${(100 * shipRates.Wins / shipRates.PlayedGames).toPrecision(2)}% [${shipRates.Wins}]`}
          </div>
      </div>
    </li>
  );
}