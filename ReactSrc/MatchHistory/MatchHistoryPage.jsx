import { Searchbar } from "./Search/Searchbar.js"
import { OverviewPerspective } from "./OverviewPerspective/OverviewPerspective.js";

export class MatchHistoryPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      searchMode: 'Overview',
      searchText: '',
      filter: {}
    }
  }

  executeSearch = (category, searchText, filter) => {
    console.log(category, searchText, filter);
    this.setState({
      searchMode: category,
      filter: filter
    });
  }

  render() {
    let pageContent;
    if (this.state.searchMode == "Overview") {
      pageContent = <OverviewPerspective filter={this.state.filter}></OverviewPerspective>
    }

    return (
      <div>
        <div id="ModInfobox">
          <span>
            <a href="https://github.com/jjeessppeer/MatchHistoryMod" target="_blank">
              Install the mod to have your match history uploaded
              <svg viewBox="0 0 24 24"><use href="icons.svg#launch" /></svg>
            </a>
          </span>
        </div>
        <Searchbar
          executeSearch={this.executeSearch}
        ></Searchbar>
        {pageContent}
      </div>
    );
  }
}

