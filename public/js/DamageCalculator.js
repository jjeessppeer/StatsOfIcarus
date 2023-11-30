import { DamageCalculator } from '/React/DamageCalculator/DamageCalculator.js';

async function initializeDamageCalculator() {

    const gunsFetch = await fetch("/guns");
    const gunItems = await gunsFetch.json();

    gunItems.sort((a, b) => (a.Size != b.Size ? (a.Size < b.Size) : (a.Name > b.Name)));

    const ammoFetch = await fetch("/ammos");
    const ammoItems = await ammoFetch.json();

    const rootDiv = document.querySelector('#dcReactRoot');
    const reactRoot = ReactDOM.createRoot(rootDiv);
    const el = React.createElement(DamageCalculator, { gunItems: gunItems, ammoItems: ammoItems });
    reactRoot.render(el);
}
initializeDamageCalculator();