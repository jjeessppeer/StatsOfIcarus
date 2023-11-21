import { game_modes, SKILL_ORDER, ship_image_srcs2, toShipImageCoordinates, spreadGunPositions } from '/js/MatchHistory/matchHistory.js';
import { getShipLoadout, getShipItem, getPlayerInfo, getLoadoutInfo } from '/js/MatchHistory/matchHistoryUtils.js';

export class MatchHistoryList extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const listElements = [];
    for (let match of this.props.matches) {
      console.log(match);
      listElements.push(<ListElement {...match}></ListElement>);
    }
    return (
      <ul className="match-history-list">
        {listElements}
      </ul>
    )
  }
}


export class ListElement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false
    }
  }
  render() {
    return (
      <li className={`match-history-entry ${this.props.Winner == 0 ? "red-winner" : "blue-winner"}`}>
        <Overview {...this.props}></Overview>
      </li>
    )
  }
}

export class Overview extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {

    let mapName = "unknown map";
    let gameMode = "unknown game mode";
    console.log(this.props)
    if (this.props.MapItem[0]) {
      mapName = this.props.MapItem[0].Name;
      gameMode = game_modes[this.props.MapItem[0].GameMode];
    }

    let eloDiv;
    if (this.props.Ranking) {
      const redElo = Math.round(this.props.Ranking.TeamRankings[0]);
      const blueElo = Math.round(this.props.Ranking.TeamRankings[1]);
      const outcome = this.props.Ranking.ExpectedOutcome;
      console.log(blueElo);
      const redPercentage = `${Math.ceil(50 * outcome)}%`;
      const bluePercentage = `${Math.ceil(50 * (1 - outcome))}%`;
      const delta = `+${Math.abs(this.props.Ranking.Delta)}`;
      eloDiv =
        <div className="elo">
          <div>
            <span className="red-elo">{redElo}</span>
            {' '}
            <span className="blue-elo">{blueElo}</span>
          </div>
          <div className="matchup-bar">
            <div className="matchup-bar-left" style={{ width: redPercentage }}></div>
            <div className="matchup-bar-right" style={{ width: bluePercentage }}></div>
          </div>
          <span className="elo-delta">{delta}</span>
        </div>
    }
    else {
      eloDiv = <div style={{ display: "none" }}></div>
    }

    const timeMinutes = Math.floor(this.props.MatchTime / 60);
    const timeSeconds = this.props.MatchTime % 60;
    const timeString = `${timeMinutes != 0 ? `${timeMinutes}m` : ""} ${timeSeconds}s`;

    const msAgo = Date.now() - this.props.Timestamp;
    const minutesAgo = msAgo / 1000 / 60;
    const hoursAgo = minutesAgo / 60;
    const daysAgo = hoursAgo / 24;
    const monthsAgo = daysAgo / 30.437;
    let timeAgoString = "";
    if (monthsAgo > 1) timeAgoString = `${Math.floor(monthsAgo)} months ago`;
    else if (daysAgo > 1) timeAgoString = `${Math.floor(daysAgo)} days ago`;
    else if (hoursAgo > 1) timeAgoString = `${Math.floor(hoursAgo)} hours ago`;
    else timeAgoString = `${Math.ceil(minutesAgo)} minutes ago`;


    let teamIcons = [];
    for (let t in this.props.Ships) {
      const shipIcons = [];
      for (let s in this.props.Ships[t]) {
        let shipInfo = getShipLoadout(this.props, this.props.Ships[t][s]);
        let shipItem = getShipItem(this.props, shipInfo.ShipModel);
        let img = <img src={`/images/item-icons/${shipItem.IconPath}`}></img>
        shipIcons.push(img);
      }
      teamIcons.push(
        <div className="team-icons">
          {shipIcons}
        </div>
      );
    }

    const DISPLAYED_TAGS = ['SCS', 'Competitive'];
    const tagSpans = [];
    for (let tag of this.props.MatchTags) {
      if (!DISPLAYED_TAGS.includes(tag)) continue;
      tagSpans.push(<span>{tag}</span>);
    }


    const nametags = [];
    for (let t in this.props.Players) {
      const shipsNametags = [];
      for (let s in this.props.Players[t]) {
        const playerNametags = [];
        for (let p in this.props.Players[t][s]) {
          const playerInfo = getPlayerInfo(this.props, this.props.Players[t][s][p]);
          const loadoutInfo = getLoadoutInfo(this.props, this.props.Skills[t][s][p]);
          const playerName = playerInfo.Name.substring(0, playerInfo.Name.length - 5);
          const roleImages = { 1: "pilot.png", 2: "engineer.png", 4: "gunner.png", 5: "neutral.png" };
          const iconSrc = `images/class-icons/${roleImages[loadoutInfo.Class]}`;

          playerNametags.push(
            <li>
              <img src={iconSrc} /><span>{playerName}</span>
            </li>
          );
        }
        shipsNametags.push(<ul>{playerNametags}</ul>);
      }
      nametags.push(<div>{shipsNametags}</div>)
    }

    return (
      <div className="overview-table">
        <div className="matchup">
          <div className="matchup-table">
            {teamIcons[0]}
            <div className="results">{`${this.props.Scores[0]}:${this.props.Scores[1]}`}</div>
            {teamIcons[1]}
          </div>
        </div>
        <div className="info">
          <div>{mapName}</div>
          <div>{gameMode}</div>
          <div>{timeString}</div>
          <div>{timeAgoString}</div>
          {eloDiv}
        </div>
        <div className="tags">{tagSpans}</div>
        <div className="players">
          {nametags}
        </div>
        <div className="expand-button"><i className="fas fa-chevron-down"></i></div>
      </div>
    )
  }
}