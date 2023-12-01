import { ShipBuilder } from '/React/ShipBuilder/ShipBuilder.js';

async function initializeShipBuilder(){
  console.log("SHIP BUILDER");

  const shipFetch = await fetch("/ships");
  const shipItems = await shipFetch.json();

  const gunsFetch = await fetch("/guns");
  const gunItems = await gunsFetch.json();

  const ammoFetch = await fetch("/ammos");
  const ammoItems = await ammoFetch.json();

  const rootDiv = document.querySelector('#shipBuilderReactRoot');
  const reactRoot = ReactDOM.createRoot(rootDiv);
  const el = React.createElement(ShipBuilder, { shipItems, gunItems, ammoItems });
  reactRoot.render(el);
}

initializeShipBuilder();