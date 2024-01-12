import { MatchHistoryList } from "../MatchList/MatchHistoryList.js";

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
          <MatchHistoryList filter={this.props.filter}></MatchHistoryList>
      )
    }
  }