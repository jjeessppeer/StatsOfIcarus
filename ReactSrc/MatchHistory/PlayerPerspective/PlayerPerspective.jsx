

import { SearchContext } from "../MatchHistoryPage.js";

export function PlayerPerspective() {
  const { search, setSearch } = React.useContext(SearchContext);

  return (
    <div className="content-area">
      hello
      {/* <div className="left-area">
        <ShipPopularityCard filter={search.filter}></ShipPopularityCard>
      </div>
      <div className="right-area">
        <MatchHistoryList filter={search.filter}></MatchHistoryList>
      </div> */}
    </div>
  );
}