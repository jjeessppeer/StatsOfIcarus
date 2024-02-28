import { Overview } from '/React/MatchHistory/MatchList/Overview.js';
import { Foldout } from '/React/MatchHistory/MatchList/Foldout.js';
import qs from 'qs';

export class MatchHistoryList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      matches: [],
      loading: false,
      loadedPages: 0
    }
  }

  componentDidMount() {
    this.reloadMatches();
  }

  componentDidUpdate(prevProps) {
    if (JSON.stringify(prevProps) != JSON.stringify(this.props)) {
      this.reloadMatches();
    }
  }

  fetchMatchListPage = async (page) => {
    const q = qs.stringify(this.props.filter, { encode: true });
    const matches = await fetch(`/match_list/page/${page}?${q}`).then(res => res.json());
    return matches;

    // console.log("Fetching matches...")
    // console.log(this.props.filter);
    // const response = await fetch('/matches', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     page: page, 
    //     filter: this.props.filter
    //   })
    // });
    // const matches = await response.json();

  }

  reloadMatches = async () => {
    this.setState({loading: true});
    const matches = await this.fetchMatchListPage(0);
    this.setState((oldState) => ({
      loading: false,
      loadedPages: 1,
      matches: matches
    }));
  }

  loadNextMatchPage = async () => {
    this.setState({loading: true});
    const matches = await this.fetchMatchListPage(this.state.loadedPages);
    this.setState((oldState) => ({
      loading: false,
      loadedPages: oldState.loadedPages + 1,
      matches: oldState.matches.concat(matches)
    }));
  }

  valueChanged = (v) => {
    console.log(v);
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
        <button class="load-more-matches-button" 
          onClick={this.loadNextMatchPage} 
          disabled={this.state.loading}>
          Show Older</button>
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
    return (
      <li className={`match-history-entry ${this.props.Winner == 0 ? "red-winner" : "blue-winner"}`}>
        <Overview {...this.props} toggleFoldout={this.toggleFoldout}></Overview>
        {this.state.expanded ? <Foldout {...this.props}></Foldout> : undefined}
      </li>
    );
  }
}
