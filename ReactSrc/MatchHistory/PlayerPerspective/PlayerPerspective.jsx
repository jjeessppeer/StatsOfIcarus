

import { SearchContext } from "../MatchHistoryPage.js";
import { MatchHistoryList } from "../MatchList/MatchHistoryList.js";

export function PlayerPerspective() {
  const { search, setSearch } = React.useContext(SearchContext);
  const playerInfo = React.useRef();

  React.useEffect(() => {
    const fetchPlayerData = async () => {
      const response = await fetch("/player")
    }
    console.log("FETCHING PLAYER DATA...");
    playerInfo.current.ini
  }, [search.active]);

  console.log(search);
  console.log("PP: ", search.filter);
  return (
    <div className="content-area">
      {/* hello */}
      <div className="left-area">
        left
        <div is="player-info-box" ref={playerInfo}/>
      </div>
      <div className="right-area">
        right
        <MatchHistoryList filter={search.active.filter}></MatchHistoryList>
      </div>
    </div>
  );
}