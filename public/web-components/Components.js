import { EloCard } from "./MatchHistory/EloCard.js";
import { PlayerLeaderboard } from "./MatchHistory/PlayerLeaderboard.js";

customElements.define('player-leaderboard', PlayerLeaderboard, { extends: 'div' });
customElements.define('elo-card', EloCard, { extends: 'div' });