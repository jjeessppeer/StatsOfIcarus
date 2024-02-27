import { MatchHistoryList } from "../MatchList/MatchHistoryList.js";
import { SearchContext, FilterContext } from "../MatchHistoryPage.js";

export function PlayerPerspective() {
  const { search, setSearch } = React.useContext(SearchContext);
  const { filterState } = React.useContext(FilterContext);
  const [ playerId, setPlayerId ] = React.useState(undefined);

  const playerInfoCard = React.useRef();

  React.useEffect(() => {
    const fetchPlayerData = async () => {
      console.log("fetching...")
      const playerInfo = await fetch(`/player_info/${filterState.filter.playerId}`).then(res => res.json());
      console.log(playerInfo);
      setSearch(s => ({
        ...s,
        text: playerInfo.Name
      }));

      setPlayerId(playerInfo._id);

      // playerInfoCard.current.load(filterState.filter.playerId, );
    }
    fetchPlayerData();
  }, [filterState]);

  // console.log(search);
  // console.log("PP: ", search.filter);
  return (
    <div className="content-area">
      {/* hello */}
      <div className="left-area">
        left
        <div is="player-info-box" ref={playerInfoCard}/>
        <div is="elo-card" player-id={playerId}></div>
        <div is="leaderboard-card"></div>
      </div>
      <div className="right-area">
        right
        <div is="player-ship-info-table"></div>
        <MatchHistoryList filter={filterState.filter}></MatchHistoryList>
      </div>
    </div>
  );
}