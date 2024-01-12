import { Searchbar } from "./Search/Searchbar.js"

export class MatchHistoryPage extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      searchMode: 'full',
      matchList: []
    }
  }



  fetchMatches = (filter) => {

  }

  render() {
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
        <Searchbar></Searchbar>
      </div>
    )
  }
}