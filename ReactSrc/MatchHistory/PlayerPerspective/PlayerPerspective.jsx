import { MatchHistoryList } from "../MatchList/MatchHistoryList.js";
import { SearchContext, FilterContext } from "../MatchHistoryPage.js";

export function PlayerPerspective() {
  const { search, setSearch } = React.useContext(SearchContext);
  const { filterState } = React.useContext(FilterContext);

  const playerInfoCard = React.useRef();
  const eloCard = React.useRef();

  React.useEffect(() => {
    const fetchPlayerInfo = async () => {
      console.log("fetching player info...")
      const playerInfo = await fetch(`/player/${filterState.filter.playerId}/info`).then(res => res.json());
      console.log(playerInfo);
      setSearch(s => ({
        ...s,
        text: playerInfo.Name
      }));

      eloCard.current.load(playerInfo._id);
      playerInfoCard.current.load(playerInfo);
      
    }
    fetchPlayerInfo();

    
  }, [filterState]);

  // console.log(search);
  // console.log("PP: ", search.filter);
  return (
    <div className="content-area">
      {/* hello */}
      <div className="left-area">
        left
        <div is="player-info-box" ref={playerInfoCard}/>
        <div is="elo-card" ref={eloCard}></div>
      </div>
      <div className="right-area">
        right
        <div is="player-ship-info-table"></div>
        <MatchHistoryList filter={filterState.filter}></MatchHistoryList>
      </div>
    </div>
  );
}