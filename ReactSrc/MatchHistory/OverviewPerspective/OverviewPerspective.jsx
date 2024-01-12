import { MatchHistoryList } from "../MatchList/MatchHistoryList.js";

export class OverviewPerspective extends React.PureComponent {
    constructor(props) {
      super(props);
  
      this.state = {
        loading: true
      }
    }


  
    render() {
    //   if (this.state.loading) {
    //     return (<div>Loading...</div>);
    //   }
        return (
            <MatchHistoryList></MatchHistoryList>
        )
    }
  }