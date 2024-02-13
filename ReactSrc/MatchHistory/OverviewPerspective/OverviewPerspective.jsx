import { MatchHistoryList } from "../MatchList/MatchHistoryList.js";
import { ShipPopularityCard } from "./ShipPopularityCard.js";
import { SearchContext } from "../MatchHistoryPage.js";

export function OverviewPerspective() {
  const { search, setSearch } = React.useContext(SearchContext);

  return (
    <div className="content-area">
      <div className="left-area">

        <ShipPopularityCard filter={search.filter}></ShipPopularityCard>
      </div>
      <div className="right-area">
        <MatchHistoryList filter={search.filter}></MatchHistoryList>

      </div>
    </div>
  );
}