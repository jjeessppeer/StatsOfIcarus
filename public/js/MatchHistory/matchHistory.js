import { MatchHistoryPage } from '/React/MatchHistory/MatchHistoryPage.js';

function initializeMatchHistory(){
    const rootDiv = document.querySelector('#matchHistory');
    const reactRoot = ReactDOM.createRoot(rootDiv);
    const el = React.createElement(MatchHistoryPage);
    reactRoot.render(el);
}

initializeMatchHistory();