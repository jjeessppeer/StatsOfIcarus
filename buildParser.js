var LZString = require('lz-string');

var ship_builder_translations = {
  "Weapon": [
    "Artemis",
    "Light Flak",
    "Gatling",
    "Flamethrower",
    "Light Carronade",
    "Harpoon",
    "Flare",
    "Mercury",
    "Mortar",
    "Banshee",
    "Mine",
    "Hades",
    "Heavy Flak Mk. I",
    "Heavy Flak Mk. II",
    "Hwatcha",
    "Heavy Carronade",
    "Lumberjack",
    "Minotaur",
    "Nemesis",
    "Aten Lens Array [Mk. S]",
    "Detonator [Mk. S]",
    "Tempest [Mk. S]",
    "Februus Weaponized Coil",
    "Februus Weaponized Coil [Mk. II]",
    "Kalakuta Gas Mortar",
    "Kalakuta Gas Mortar [Mk. II]",
    "Seraph Tempest Missiles",
    "Seraph Tempest Missiles [Mk. II]",
    "Aten Lens Array",
    "Aten Lens Array [Mk. II]",
    "Immortal Gaze Heavy Accelerator",
    "Immortal Gaze Heavy Accelerator [Mk. II]",
    "Roaring Tiger Heavy Detonator",
    "Roaring Tiger Heavy Detonator [Mk. II]",
    "None"],
  "Ship": [
    "Goldfish",
    "Junker",
    "Squid",
    "Galleon",
    "Spire",
    "Pyramidion",
    "Mobula",
    "Magnate",
    "Crusader",
    "Judgement",
    "Corsair",
    "Shrike",
    "Stormbreaker"],
  "Ammo":[
    "Normal",
    "Lochnagar",
    "Heavy",
    "Incendiary",
    "Burst",
    "Greased",
    "Lesmok",
    "Heatsink",
    "Charged",
    "Extended"],
  "Crew": [
    "Noclass",
    "Pilot",
    "Gunner",
    "Engineer"],
  "EngiTool": [
    "Spanner",
    "Mallet",
    "Pipe",
    "Failsafe",
    "Extinguisher",
    "Chemspray",
    "Buff"],
  "PilotTool":[
    "Spyglass",
    "Rangefinder",
    "Claw",
    "Kerosene",
    "Moonshine",
    "Hydrogen",
    "Vent",
    "Chute",
    "Bumpers",
    "Tar",
    "Sail"],
  "Ability": [
    "MechanizedRebuild",
    "SalvoNeutralizer",
    "CombustionDampener",
    "AdvancedDynaBuff",
    "StaticTurret",
    "ComponentDisruption",
    "LightningDraw",
    "ConcussiveBlast",
    "MineEjection",
    "GigatonBlast",
    "ProximalDetonation",
    "CataclysmRounds",
    "EngineStabilization",
    "RushingDrift",
    "OversurgeRam",
    "AirHorn",
    "EnhancedEnvelope",
    "TarBomb"]
};

function parseBuildCode(build_code){
  build_code = LZString.decompressFromEncodedURIComponent(build_code);
  build_code = build_code.split(",");

  // Validate
  if (typeof build_code[53] != 'string')
    return false;
  if (typeof build_code[67] != 'string')
    return false;
  for (let i=0; i<build_code.length; i++){
    if (i == 53 || i == 67)
      continue;
    build_code[i] = parseInt(build_code[i]);
    if (build_code[i] == NaN)
      return false;
  }

  build_data = {};
  build_data.name = build_code[53];
  build_data.ship = ship_builder_translations["Ship"][build_code[0]];

  build_data.pve = (build_code.length >= 54 && build_code[54]=="1");


  build_data.guns = [];
  let gun_codes = build_code.slice(1, 7);
  for (let i=0; i < gun_codes.length; i++){
    build_data.guns.push(ship_builder_translations["Weapon"][gun_codes[i]]);
  }

  build_data.ammo = [];
  let ammo_codes = build_code.slice(7, 13);
  for (let i=0; i < ammo_codes.length; i++){
    build_data.ammo.push(ship_builder_translations["Ammo"][ammo_codes[i]]);
  }


  build_data.crew = [];
  let crew_codes = build_code.slice(13, 53);
  let ability_codes = build_code.slice(55, 67);
  for (let i=0; i<4; i++){
    let loadout = {};
    loadout.role = ship_builder_translations["Crew"][crew_codes[i*10]];
    loadout.pilotTools = [];
    loadout.engiTools = [];
    loadout.ammo = [];
    loadout.abilities = [];
    for (let j=1; j<=3; j++){
      loadout.pilotTools.push(ship_builder_translations["PilotTool"][crew_codes[i*10+j]]);
      loadout.engiTools.push(ship_builder_translations["EngiTool"][crew_codes[i*10+j+3]]);
      loadout.ammo.push(ship_builder_translations["Ammo"][crew_codes[i*10+j+6]]);
      if (ability_codes.length == 12)
        loadout.abilities.push(ship_builder_translations["Ability"][ability_codes[3*i+j-1]]);
      else
        loadout.abilities = ["MechanizedRebuild", "LightningDraw", "EngineStabilization"];
    }
    build_data.crew.push(loadout);
  }

  if (build_code.length >= 67) build_data.description = build_code[67];
  else build_data.description = "";

  return build_data;
}




exports.parseBuildCode = parseBuildCode;