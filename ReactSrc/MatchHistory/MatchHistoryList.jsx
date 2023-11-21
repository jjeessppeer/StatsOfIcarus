import { Overview } from '/React/MatchHistory/Overview.js';
import { Foldout } from '/React/MatchHistory/Foldout.js';

export class MatchHistoryList extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const listElements = [];
    for (let match of this.props.matches) {
      console.log(match);
      listElements.push(<ListElement {...match}></ListElement>);
    }
    return (
      <ul className="match-history-list">
        {listElements}
      </ul>
    )
  }
}

export class ListElement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false
    }

    this.toggleFoldout = this.toggleFoldout.bind(this);
  }

  toggleFoldout() {
    console.log("TOGGLING");
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
    )
  }
}