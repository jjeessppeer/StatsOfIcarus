import { EloCard } from "./MatchHistory/EloCard.js";
import { PlayerInfoBox } from "./MatchHistory/PlayerInfo.js";

customElements.define('elo-card', EloCard, { extends: 'div' });
customElements.define('player-info-box', PlayerInfoBox, { extends: 'div' });