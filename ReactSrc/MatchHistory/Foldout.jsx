import { MatchDetails } from "/React/MatchHistory/DetailsTab.js";

export class Foldout extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="foldout">
        <ul>
          <li><button class="selected">Overview</button></li>
          <li><button>Gunning</button></li>
          <li><button>Positions</button></li>
        </ul>
        <div class="content">
          <MatchDetails {...this.props}></MatchDetails>
        </div>
      </div>
    )
  }
}

