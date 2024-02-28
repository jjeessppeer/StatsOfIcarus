import { MatchHistoryList } from "../MatchList/MatchHistoryList.js";
import { SearchContext, FilterContext } from "../MatchHistoryPage.js";
import qs from 'qs';

export function PlayerPerspective() {
  const { search, setSearch } = React.useContext(SearchContext);
  const { filterState } = React.useContext(FilterContext);

  const playerInfoCard = React.useRef();
  const eloCard = React.useRef();
  const shipStatCard = React.useRef();

  React.useEffect(() => {
    const fetchPlayerInfo = async () => {
      const playerInfo = await fetch(`/player/${filterState.filter.playerId}/info`)
        .then(res => res.json());
      const playerShipStats = await fetch(`/player/${playerInfo._id}/ship_stats?${qs.stringify(filterState.filter)}`)
        .then(res => res.json());
      
      playerInfoCard.current.load(playerInfo);
      playerInfoCard.current.loadCharts(playerShipStats);
      eloCard.current.load(playerInfo._id);
      shipStatCard.current.load(playerShipStats);

      setSearch(s => ({
        ...s,
        text: playerInfo.Name
      }));
    }
    fetchPlayerInfo();
  }, [filterState]);

  return (
    <div className="content-area">
      {/* hello */}
      <div className="left-area">
        <div is="player-info-box" ref={playerInfoCard} key={JSON.stringify(filterState.filter)}/>
        <div is="elo-card" ref={eloCard}></div>
      </div>
      <div className="right-area">
        <div is="player-ships-card" ref={shipStatCard} key={JSON.stringify(filterState.filter)}></div>
        <MatchHistoryList filter={filterState.filter}></MatchHistoryList>
      </div>
    </div>
  );
}