import { MatchHistoryList } from "../MatchList/MatchHistoryList.js";
import { ShipPopularityCard } from "./ShipPopularityCard.js";
import { SearchContext } from "../MatchHistoryPage.js";

export function OverviewPerspective() {
  const { search, setSearch } = React.useContext(SearchContext);
  console.log(search.active)
  return (
    <div className="content-area">
      <div className="left-area">
        <ShipPopularityCard filter={search.active.filter}></ShipPopularityCard>
      </div>
      <div className="right-area">
        <MatchHistoryList filter={search.active.filter}></MatchHistoryList>
      </div>
    </div>
  );
}