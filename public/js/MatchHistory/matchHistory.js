import '/js/MatchHistory/elements/ShipPopularity.js';
import '/js/MatchHistory/elements/PlayerShipInfo.js';

import { SKILL_ORDER, ship_image_srcs2, game_modes, SHIP_ITEMS, CLASS_COLORS, ship_scales, ship_offsets } from '/js/constants.js';
import { ShipLoadoutInfoList } from '/React/ShipStats/LoadoutInfoList.js';
import { mergeLoadoutInfos, mapLoadoutId, mergeMatchupStats } from '/React/ShipStats/LoadoutUtils.js';
import { MatchHistoryList } from '/React/MatchHistory/MatchList/MatchHistoryList.js';

import { MatchHistoryPage } from '/React/MatchHistory/MatchHistoryPage.js';

const DEFAULT_QUERY = {
    perspective: {type: "Overview", name: ""},
    filters: []
};

var current_match_filters = [];

function initializeMatchHistory(){
    const rootDiv = document.querySelector('#matchHistory');
    const reactRoot = ReactDOM.createRoot(rootDiv);
    const el = React.createElement(MatchHistoryPage);
    reactRoot.render(el);
}

initializeMatchHistory();