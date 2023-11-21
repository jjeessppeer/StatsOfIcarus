import { SKILL_ORDER } from '/js/MatchHistory/matchHistory.js';
import { getShipLoadout, getPlayerInfo, getLoadoutInfo, getSkillItem } from '/js/MatchHistory/matchHistoryUtils.js';
import { ShipCanvas } from '/React/ShipCanvas.js';

export class MatchDetails extends React.Component {
    constructor(props) {
      super(props);
    }
    render() {
      return (
        <div className="details">
          <div>
            <ShipCrew teamIdx={0} shipIdx={0} {...this.props}></ShipCrew>
            <ShipCrew teamIdx={0} shipIdx={1} {...this.props}></ShipCrew>
            </div>
          <div>
            <ShipCrew teamIdx={1} shipIdx={0} {...this.props}></ShipCrew>
            <ShipCrew teamIdx={1} shipIdx={1} {...this.props}></ShipCrew>
          </div>
        </div>
      )
    }
  }
  
  export class ShipCrew extends React.Component {
    constructor(props) {
      super(props);
    }
    render() {
      const teamIdx = this.props.teamIdx;
      const shipIdx = this.props.shipIdx
  
      let shipName = "EMPTY SHIP";
      const playerElements = [];
      let shipModel = -1;
      let shipLoadoutGuns = [];
  
      if (this.props.Ships[teamIdx][shipIdx] != undefined) {
        shipName = this.props.ShipNames[teamIdx][shipIdx];
  
        for (let i = 0; i < 4; i++) {
          const player = getPlayerInfo(this.props, this.props.Players[teamIdx][shipIdx][i]);
          const loadout = getLoadoutInfo(this.props, this.props.Skills[teamIdx][shipIdx][i]);
          const playerName = player.Name.substring(0, player.Name.length - 5);
          let roleImages = { 1: "pilot.png", 2: "engineer.png", 4: "gunner.png" };
          const iconSrc = `images/class-icons/${roleImages[loadout.Class]}`;
          loadout.Skills.sort((a, b) => {
            let itemA = getSkillItem(this.props, a);
            let itemB = getSkillItem(this.props, b);
            return SKILL_ORDER.indexOf(itemA.Name) - SKILL_ORDER.indexOf(itemB.Name);
          });
  
          const skillImgs = [];
          for (let l = 0; l < loadout.Skills.length; l++) {
            let skillItem = getSkillItem(this.props, loadout.Skills[l]);
            skillImgs.push(<img src={`/images/item-icons/${skillItem.IconPath}`}></img>);
          }
  
          playerElements.push(
            <li>
              <div>
                <img src={iconSrc}></img>
                {skillImgs}
              </div>
              <span>{playerName}</span>
            </li>
          );
        }
  
        const shipLoadout = getShipLoadout(this.props, this.props.Ships[teamIdx][shipIdx]);
        shipModel = shipLoadout.ShipModel;
        shipLoadoutGuns = shipLoadout.Loadout;
  
      }
      return (
        <div className="shipcrew">
          <span>{shipName}</span>
          <div>
            <ShipCanvas shipModel={shipModel} shipLoadout={shipLoadoutGuns} width='175' height='250'></ShipCanvas>
            <ul>
              {playerElements}
            </ul>
          </div></div>
      )
    }
  }