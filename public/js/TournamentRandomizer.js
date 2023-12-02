import { TournamentGenerator } from "/React/Maps/TournamentGenerator.js";

async function initializeTournamentRanomizer(){
    const rootDiv = document.querySelector('#mapsReactRoot');
    const reactRoot = ReactDOM.createRoot(rootDiv);
    const el = React.createElement(TournamentGenerator, { });
    reactRoot.render(el);
}

initializeTournamentRanomizer();