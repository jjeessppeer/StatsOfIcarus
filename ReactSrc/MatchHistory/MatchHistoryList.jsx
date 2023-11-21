import { Overview } from '/React/MatchHistory/Overview.js';
import { Foldout } from '/React/MatchHistory/Foldout.js';

export class MatchHistoryList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      matches: this.props.matches,
      currentPage: 0,
      loading: false
    }
    this.requestNextPage = this.requestNextPage.bind(this);
  }

  async requestNextPage() {
    this.setState({
      loading: true,
    });
    let response = await fetch('/request_matches', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: this.state.currentPage + 1, 
          filters: this.props.searchFilters
        })
    });
    let json = await response.json();
    this.setState((oldState) => ({
        loading: false,
        currentPage: oldState.currentPage + 1,
        matches: oldState.matches.concat(json.Matches)
    }));
  }

  render() {
    const listElements = [];
    for (let match of this.state.matches) {
      listElements.push(<ListElement {...match}></ListElement>);
    }
    return (
      <div>
        <ul className="match-history-list">
          {listElements}
        </ul>
        <button class="load-more-matches-button" onClick={this.requestNextPage} disabled={this.state.loading}>Show Older</button>
      </div>

    )
  }
}

export class ListElement extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false
    }

    this.toggleFoldout = this.toggleFoldout.bind(this);
  }

  toggleFoldout() {
    this.setState((oldState) => ({
      expanded: !oldState.expanded
    }));
  }

  render() {
    console.log("ELEMENT RENDERING");
    return (
      <li className={`match-history-entry ${this.props.Winner == 0 ? "red-winner" : "blue-winner"}`}>
        <Overview {...this.props} toggleFoldout={this.toggleFoldout}></Overview>
        {this.state.expanded ? <Foldout {...this.props}></Foldout> : undefined}
      </li>
    );
  }
}
