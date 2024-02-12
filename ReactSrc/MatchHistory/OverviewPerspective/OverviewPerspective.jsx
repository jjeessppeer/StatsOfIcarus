import { MatchHistoryList } from "../MatchList/MatchHistoryList.js";
import { ShipPopularityCard } from "./ShipPopularityCard.js";


// E:\Dev\tmp\activeStats\StatsOfIcarus\public\React\MatchHistory\OverviewPerspective\ShipPopularityCard.js
export class OverviewPerspective extends React.PureComponent {
    constructor(props) {
      super(props);
  
      this.state = {
        loading: false
      }
    }


  
    render() {
      if (this.state.loading) {
        return (<div>Loading...</div>);
      }

      console.log("Overview render...")
      return (
        <div className="content-area">
          <div className="left-area">

          <ShipPopularityCard filter={this.props.filter}></ShipPopularityCard>
          </div>
          <div className="right-area">
          <MatchHistoryList filter={this.props.filter}></MatchHistoryList>

          </div>
        </div>
      )
    }
  }