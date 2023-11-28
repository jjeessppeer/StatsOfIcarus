import { MatchDetails } from "/React/MatchHistory/DetailsTab.js";
import { GunnerTab } from "/React/MatchHistory/GunnerTab.js";
import { HeatmapTab } from "/React/MatchHistory/HeatmapTab/HeatmapTab.js";
import { clsx } from 'clsx';

export class Foldout extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      currentTabIdx: 2
    }

    this.tabChanged = this.tabChanged.bind(this);
  }

  tabChanged(idx) {
    this.setState({ currentTabIdx: idx });
  }

  render() {
    return (
      <div className="foldout">
        <ul>
          <TabButton title="Overview" tabIdx={0} currentTabIdx={this.state.currentTabIdx} onClick={this.tabChanged}></TabButton>
          <TabButton title="Gunning" tabIdx={1} currentTabIdx={this.state.currentTabIdx} onClick={this.tabChanged}></TabButton>
          <TabButton title="Positions" tabIdx={2} currentTabIdx={this.state.currentTabIdx} onClick={this.tabChanged}></TabButton>
        </ul>
        <div class="content">
          {this.state.currentTabIdx == 0 && <MatchDetails {...this.props}></MatchDetails>}
          {this.state.currentTabIdx == 1 && <GunnerTab {...this.props}></GunnerTab>}
          {this.state.currentTabIdx == 2 && <HeatmapTab {...this.props}></HeatmapTab>}
        </div>
      </div>
    )
  }
}


class TabButton extends React.PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const selected = this.props.tabIdx == this.props.currentTabIdx;
    return (
      <li>
        <button
          class={clsx(selected && 'selected')}
          onClick={() => { this.props.onClick(this.props.tabIdx) }}>
          {this.props.title}
        </button>
      </li>
    );
  }
}
