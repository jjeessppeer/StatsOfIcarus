import { MatchHistoryList } from "../MatchList/MatchHistoryList.js";
import { ShipPopularityCard } from "./ShipPopularityCard.js";
import { FilterContext } from "../MatchHistoryPage.js";

export function OverviewPerspective() {
  const { filterState } = React.useContext(FilterContext);
  return (
    <div className="content-area">
      <div className="left-area">
        <ShipPopularityCard filter={filterState.filter}></ShipPopularityCard>
      </div>
      <div className="right-area">
        <MatchHistoryList filter={filterState.filter}></MatchHistoryList>
      </div>
    </div>
  );
}