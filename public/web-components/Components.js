import { EloCard } from "./MatchHistory/EloCard.js";
import { PlayerInfoBox } from "./MatchHistory/PlayerInfo.js";
import { PlayerShipsCard, PlayerShipInfoCell } from "./MatchHistory/PlayerShipsCard.js";

customElements.define('elo-card', EloCard, { extends: 'div' });
customElements.define('player-info-box', PlayerInfoBox, { extends: 'div' });

customElements.define('player-ships-card', PlayerShipsCard, { extends: 'div' });
customElements.define('player-ship-info-cell', PlayerShipInfoCell, { extends: 'div' });