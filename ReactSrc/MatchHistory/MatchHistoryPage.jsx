import { Searchbar } from "./Search/Searchbar.js"
import { OverviewPerspective } from "./OverviewPerspective/OverviewPerspective.js";
import { PlayerPerspective } from "./PlayerPerspective/PlayerPerspective.js";



export const SearchContext = React.createContext({
  search: {
    text: "",
    changed: false,
    tagsInclude: [],
    tagsExclude: []
  },
  setSearch: () => { },
  executeSearch: () => { }
});

export const FilterContext = React.createContext({
  filterState: {
    filter: {},
    mode: "Overview"
  },
  setFilterStater: () => {}
});

export function MatchHistoryPage() {
  const [search, setSearch] = React.useState({
    text: "w",
    changed: false,
    tagsInclude: [],
    tagsExclude: []
  });

  const [filterState, setFilterState] = React.useState({
    filter: {},
    mode: "Overview"
  });

  // const [searchMode, setSearchMode] = React.useState("Overview");
  // const [filter, setFilter] = React.useState({});

  const executeSearch = async (mode) => {
    // Load search state into filters.
    console.log("EXECUTING SEARCH: ", mode);
    const f = {};
    if (search.tagsExclude.length > 0) f.tagsExclude = JSON.parse(JSON.stringify(search.tagsExclude));
    if (search.tagsInclude.length > 0) f.tagsInclude = JSON.parse(JSON.stringify(search.tagsInclude));
    if (mode === "Player") {
      const r = await fetch(`/player_id/${search.text}`);
      if (r.status !== 404) f.playerId = await r.json();
    }

    setFilterState({
      filter: f,
      mode: mode
    });
  };

  React.useEffect(() => {
    executeSearch("Player");
  }, []);

  let pageContent;
  if (filterState.mode == "Overview") {
    pageContent = <OverviewPerspective></OverviewPerspective>
  }
  else if (filterState.mode === "Player") {
    pageContent = <PlayerPerspective></PlayerPerspective>
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
      <SearchContext.Provider value={{ search, setSearch, executeSearch }}>
        <FilterContext.Provider value={{filterState, setFilterState}}>
          <Searchbar></Searchbar>
          {pageContent}
        </FilterContext.Provider>
      </SearchContext.Provider>
    </div>
  )
}

