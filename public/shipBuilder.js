

var ship_builder_guns = ["None", "None", "None", "None", "None", "None"];
var ship_builder_ship = "Mobula";

var gun_colors = ["#e6194B", "#f58231", "#3cb44b", "#4363d8", "#911eb4", "#808000"];


var build_last_pos_x = undefined;
var build_last_pos_y = undefined;

var builder_matrix = [
  1, 0, 0, 
  0, 1, 0,
  0, 0, 1];

var ship_image_srcs = {
  "Corsair": "ship-images/corsair_gundeck_small.png",
  "Crusader": "ship-images/crusader_gundeck_small.png",
  "Galleon": "ship-images/galleon_gundeck_small.png",
  "Goldfish": "ship-images/goldfish_gundeck_small.png",
  "Judgement": "ship-images/judge_gundeck_small.png",
  "Junker": "ship-images/junker_gundeck_small.png",
  "Magnate": "ship-images/magnate_gundeck_small.png",
  "Mobula": "ship-images/mob_gundeck_small.png",
  "Pyramidion": "ship-images/pyra_gundeck_small.png",
  "Shrike": "ship-images/shrike_gundeck_small.png",
  "Spire": "ship-images/spire_gundeck_small.png",
  "Squid": "ship-images/squid_gundeck_small.png",
  "Stormbreaker": "ship-images/storm_gundeck_small.png" 
}

function initializeShipBuilder(){
  if (!(gun_dataset && ammo_dataset && ship_dataset && ship_guns_dataset && map_dataset)) {
    setTimeout(function(){ initializeShipBuilder(); }, 1000);
    return;
  }

  // Fill ship list
  for (let i=0; i < ship_guns_dataset.getNOfRows(); i++){
    let ship_name = ship_guns_dataset.getDatasetCell(i, 0);
    if (ship_name == "Mobula")
      $("#shipBuildShipSelection").append($("<option selected>"+ ship_guns_dataset.getDatasetCell(i, 0) +"</option>"));
    else
      $("#shipBuildShipSelection").append($("<option>"+ ship_guns_dataset.getDatasetCell(i, 0) +"</option>"));
  }
  

  $("#copyBuildLinkBtn").on("click", function(){
    copyToClipboard(window.location.href);
    this.innerHTML = "Copied to clipboard";
  });

  $("#shipBuilderDesCheck").on("change", function(){
    console.log($("#shipBuilderDesCheck").is(":checked"))
    if ($("#shipBuilderDesCheck").is(":checked"))
      $("#buildDescriptionCol").show("slide", {direction: "left"}, 400);
    else
      $("#buildDescriptionCol").hide("slide", {direction: "left"}, 400);

  });

  $("#shipBuilderPvECheck").on("change", function(){
    crewRoleChanged();
    shipBuilderReloadShip();
    updateShipBuildImage();
  });

  $("#shipBuildName,#buildDescriptionArea").on("input", shipBuilderUpdateUrl);
  $("#shipBuilderDesCheck,#shipBuilderPvECheck").on("change", shipBuilderUpdateUrl);

  // Ship change event
  $("#shipBuildShipSelection").on("change", function(e){
    ship_builder_ship = $(this).val();
    shipBuilderReloadShip();
    updateShipBuildImage(true);
    updateRangeVis();
    shipBuilderUpdateUrl()
  });

  

  let loadout_menu = $("#crewLoadouts > div");
  $("#crewLoadouts").append(loadout_menu.clone());
  $("#crewLoadouts").append(loadout_menu.clone());
  $("#crewLoadouts").append(loadout_menu.clone());

  // Initialize crew loadout menu
  $("#crewLoadouts a").on("click", function(e){
    $(this).parent().siblings()[0].childNodes[1].src = $(this)[0].childNodes[0].src;
    shipBuilderUpdateUrl()
  });

  $("#crewLoadouts > div > div:nth-of-type(2)").on("click", function(e){
    crewRoleChanged();
    shipBuilderUpdateUrl()
  });

  
  

  // Canvas events

  $("#shipBuilderCanvas").mousemove(function(e){
    if (e.originalEvent.buttons == 0){
      build_last_pos_x = undefined;
      build_last_pos_y = undefined;
      return;
    }

    let canvas = document.getElementById("shipBuilderCanvas");
    let ctx = canvas.getContext("2d");
    
    // let pos_x = e.originalEvent.layerX;
    // let pos_y = e.originalEvent.layerY;

    let [pos_x, pos_y] = [e.originalEvent.layerX, e.originalEvent.layerY];
    if (!build_last_pos_x || !build_last_pos_y){
      build_last_pos_x = pos_x;
      build_last_pos_y = pos_y;
    }

    // console.log(pos_x, ", ", build_last_pos_x);
    let dx = pos_x - build_last_pos_x;
    let dy = pos_y - build_last_pos_y;

    // dx /= ctx.getTransform().a;
    // dy /= ctx.getTransform().d;
    dx /= builder_matrix[0];
    dy /= builder_matrix[4];

    // console.log(ctx.getTransform().a);

    // let [dx, dy] = translatePoint()
    // ctx.translate(dx, dy);
    translateMatrix(builder_matrix, dx, dy);

    applyMatrix(ctx, builder_matrix);
    // build_offset_x -= build_last_pos_x - pos_x;
    // build_offset_y -= build_last_pos_y - pos_y;
    updateShipBuildImage();
    
    build_last_pos_x = pos_x;
    build_last_pos_y = pos_y;
  });

  $("#shipBuilderCanvas").on("wheel", function(e){
    let canvas = document.getElementById("shipBuilderCanvas");
    let ctx = canvas.getContext("2d");

    let factor = (e.originalEvent.deltaY < 0) ? 1.1 : 0.9;

    let [pos_x, pos_y] = [e.originalEvent.layerX, e.originalEvent.layerY];
    // ctx.zoomAround(pos_x, pos_y, factor);
    zoomMatrixAround(builder_matrix, pos_x, pos_y, factor);
    applyMatrix(ctx, builder_matrix);
    
    updateShipBuildImage();
    return false;
  });

  $("#weaponSelections select:nth-of-type(1)").on("change", function(e){
    ship_builder_guns[($(this).parent().index()-1)] = $(this).val();
    updateShipBuildImage();
    updateRangeVis();
    shipBuilderUpdateUrl()
  });

  $("#weaponSelections select:nth-of-type(2)").on("change", function(e){
    updateShipBuildImage();
    updateRangeVis();
    shipBuilderUpdateUrl();
  });

  $("#shipBuildExportButton").on("click", shipBuilderExport);
  $("#shipBuildImportButton").on("click", shipBuilderImport);



  // $("[data-show='#" + window.location.hash.substr(1).split("?")[0] + "']").trigger("click");
  if (window.location.hash.substr(1).split("?")[0] == "shipBuilder" && getUrlParam(window.location.href)){
    let url_parameters = getUrlParameterList();
    if (url_parameters.build_code)
      shipBuilderImport(null, url_parameters.build_code);
    else if (url_parameters.id){
      shipBuilderImportFromDatabase(url_parameters.id);
    }
  }
  else {
    shipBuilderReloadShip();
    updateShipBuildImage();
    updateRangeVis();
    crewRoleChanged();
  }
}

function shipBuilderUpdateUrl(){
  $("#copyBuildLinkBtn").text("Copy build link");
  setUrlParam("build_code="+shipBuilderGetExportCode());
}


function parseBuildCode(build_code){
  build_code = LZString.decompressFromEncodedURIComponent(build_code);
  build_code = build_code.split(",");

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

function shipBuilderImportFromDatabase(build_id){
  console.log("Requesting single build ", build_id);
  httpxPostRequest("/request_single_build", [build_id], function(){
    if (this.readyState == 4 && this.status == 200){
      let response = JSON.parse(this.response);
      let build_code = sanitizeHtml(response[0]);
      let description = sanitizeHtml(response[1]);
      let build_data = parseBuildCode(build_code);
      build_data.description = description;
      shipBuilderImport(null, build_data, false);
    }
  });
}

function shipBuilderImport(e, build_code, encoded=true){
  if (!build_code)
    build_code = $("#shipBuildImportText").val();
  // build_code = atob(build_code);
  let build_data;
  if (encoded)
    build_data = parseBuildCode(build_code);
  else
    build_data = build_code

  ship_builder_ship = build_data.ship;
  $("#shipBuildShipSelection").val(ship_builder_ship);
  $("#shipBuilderPvECheck").prop('checked', build_data.pve);
  
  shipBuilderReloadShip();

  ship_builder_guns = build_data.guns;
  for (let i=0; i < ship_builder_guns.length; i++){
    let select = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(1)");
    select.val(ship_builder_guns[i]);
  }

  for (let i=0; i < build_data.ammo.length; i++){
    let select = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(2)");
    select.val(build_data.ammo[i]);
  }

  // let crew_codes = build_code.slice(13, 53)
  // let ability_codes = build_code.slice(55, 67);
  let imgs = $("#crewLoadouts button img");
  // let loadout_count = 0;
  // let ability_count = 0;
  for (let i=0; i < 4; i+=1){
    imgs[i*13].src = "loadout-images/" + build_data.crew[i].role + ".jpg";
    for (let j=1; j < 3; j++){
      imgs[i*13 + j].src = "loadout-images/" + build_data.crew[i].pilotTools[j-1] + ".jpg";
      imgs[i*13 + j + 3].src = "loadout-images/" + build_data.crew[i].engiTools[j-1] + ".jpg";
      imgs[i*13 + j + 6].src = "loadout-images/" + build_data.crew[i].ammo[j-1] + ".jpg";
      imgs[i*13 + j + 9].src = "loadout-images/" + build_data.crew[i].abilities[j-1] + ".jpg";
    }
  }
  $("#shipBuildName").val(build_data.name);
  

  if (build_data.description !== "") $("#buildDescriptionCol").show();
  else $("#buildDescriptionCol").hide();
  $("#shipBuilderDesCheck").prop('checked', build_data.description!="");
  $("#buildDescriptionArea").val(build_data.description);

  crewRoleChanged();
  updateShipBuildImage(true, true);
  updateRangeVis();
  shipBuilderUpdateUrl();
}

function shipBuilderExport(){
  
  let ammo_types = [];
  for (let i=1; i <= 6; i++){
    ammo_types.push($("#weaponSelections > div:nth-of-type("+i+") > select:nth-of-type(2)").val());
  }

  let imgs = $("#crewLoadouts button img");
  let crew_selections = [];
  for (let i=0; i < imgs.length; i++){
    let selection = imgs[i].src;
    selection = selection.substring(selection.lastIndexOf('/') + 1);
    selection = selection.split(".")[0];
    crew_selections.push(selection);
  }

  let export_string = shipBuilderGetExportCode();
  
  $("#shipBuildImportText").val(export_string);
}

function shipBuilderGetExportCode(include_description=true){
  let guns = [];
  for (let i=1; i <= 6; i++){
    let weapon_type = $("#weaponSelections > div:nth-of-type("+i+") > select:nth-of-type(1)").val();
    guns.push(ship_builder_translations["Weapon"].indexOf(weapon_type));
  }

  let ammo_types = [];
  for (let i=1; i <= 6; i++){
    // ammo_types.push($("#weaponSelections > div:nth-of-type("+i+") > select:nth-of-type(2)").val());
    let ammo_type = $("#weaponSelections > div:nth-of-type("+i+") > select:nth-of-type(2)").val();
    ammo_types.push(ship_builder_translations["Ammo"].indexOf(ammo_type));
  }

  let imgs = $("#crewLoadouts button img");
  let crew_selections = [];
  let PvE_abilities = [];
  for (let i=0; i < imgs.length; i+=13){
    let selection = imgs[i].src;
    crew_selections.push(ship_builder_translations["Crew"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+1].src;
    crew_selections.push(ship_builder_translations["PilotTool"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+2].src;
    crew_selections.push(ship_builder_translations["PilotTool"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+3].src;
    crew_selections.push(ship_builder_translations["PilotTool"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+4].src;
    crew_selections.push(ship_builder_translations["EngiTool"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+5].src;
    crew_selections.push(ship_builder_translations["EngiTool"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+6].src;
    crew_selections.push(ship_builder_translations["EngiTool"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+7].src;
    crew_selections.push(ship_builder_translations["Ammo"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+8].src;
    crew_selections.push(ship_builder_translations["Ammo"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+9].src;
    crew_selections.push(ship_builder_translations["Ammo"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    
    selection = imgs[i+10].src;
    PvE_abilities.push(ship_builder_translations["Ability"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+11].src;
    PvE_abilities.push(ship_builder_translations["Ability"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    selection = imgs[i+12].src;
    PvE_abilities.push(ship_builder_translations["Ability"].indexOf(selection.substring(selection.lastIndexOf('/') + 1).split(".")[0]));
    
  }

  let description = ($("#shipBuilderDesCheck").is(":checked") && include_description ? $("#buildDescriptionArea").val() : "");
  description = description.replace(/,/g, ' ');
  // console.log(PvE_abilities)
  
  let export_string = "";
  export_string += ship_builder_translations["Ship"].indexOf(ship_builder_ship) // Ship
  export_string += "," + guns.join() //Guns
  export_string += "," + ammo_types.join() //Ammo
  export_string += "," + crew_selections.join()  //Crew
  export_string += "," + $("#shipBuildName").val(); //Name
  export_string += "," + ($("#shipBuilderPvECheck").is(":checked") ? "1" : "0"); // PvE
  export_string += "," + PvE_abilities.join();
  export_string += "," + description;

  export_string = LZString.compressToEncodedURIComponent(export_string);

  return export_string;
}

function crewRoleChanged(){

  let imgs = $("#crewLoadouts > div > div:nth-of-type(2) > button > img");
  // console.log($(imgs[0]).parent().parent().parent().find("> div"));
  for (let i=0; i < imgs.length; i++){
    let role = imgs[i].src;
    role = role.substring(role.lastIndexOf('/') + 1);
    role = role.split(".")[0];


    let siblings = $(imgs[i]).parent().parent().parent().find("> div");

    if (role == "Pilot"){
      $(siblings[2]).show();
      $(siblings[3]).show();
      $(siblings[4]).show();

      $(siblings[5]).show();
      $(siblings[6]).hide();
      $(siblings[7]).hide();

      $(siblings[8]).show();
      $(siblings[9]).hide();
      $(siblings[10]).hide();

      $(siblings[11]).hide();
      $(siblings[12]).hide();
      $(siblings[13]).show();

    }
    else if (role == "Gunner"){
      $(siblings[2]).show();
      $(siblings[3]).hide();
      $(siblings[4]).hide();

      $(siblings[5]).show();
      $(siblings[6]).show();
      $(siblings[7]).hide();

      $(siblings[8]).show();
      $(siblings[9]).show();
      $(siblings[10]).show();

      $(siblings[11]).hide();
      $(siblings[12]).show();
      $(siblings[13]).hide();

    }
    else if (role == "Engineer"){
      $(siblings[2]).show();
      $(siblings[3]).hide();
      $(siblings[4]).hide();

      $(siblings[5]).show();
      $(siblings[6]).show();
      $(siblings[7]).show();

      $(siblings[8]).show();
      $(siblings[9]).hide();
      $(siblings[10]).hide();

      $(siblings[11]).show();
      $(siblings[12]).hide();
      $(siblings[13]).hide();
    }
    else if (role == "Noclass"){
      $(siblings[2]).hide();
      $(siblings[3]).hide();
      $(siblings[4]).hide();

      $(siblings[5]).hide();
      $(siblings[6]).hide();
      $(siblings[7]).hide();

      $(siblings[8]).hide();
      $(siblings[9]).hide();
      $(siblings[10]).hide();

      $(siblings[11]).hide();
      $(siblings[12]).hide();
      $(siblings[13]).hide();
    }
    if(!$("#shipBuilderPvECheck").is(":checked")){
      $(siblings[11]).hide();
      $(siblings[12]).hide();
      $(siblings[13]).hide();
    }
  }
}


function shipBuilderReloadShip(){

  // $("#shipBuilderImage")[0].src = ship_image_srcs[ship_builder_ship];

  ship_builder_guns.fill("None");
  
  let ship_data = ship_guns_dataset.filterByString(ship_builder_ship, "Ship").getDatasetRow(0);
  let n_guns = parseInt(ship_data[1]);
  for (let i=0; i < n_guns; i++){
    // console.log(gun_dataset.filterByString("PvE", "Mode"));
    let available_guns = gun_dataset.filterByString(ship_data[14+i], "Weapon slot");
    if (!$("#shipBuilderPvECheck").is(":checked"))
      available_guns = available_guns.filterByString("PvP", "Mode");
    let select = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(1)");
    select.empty();
    for (let j=0; j < available_guns.getNOfRows(); j++){
      select.append($("<option>"+available_guns.getDatasetCell(j, 1)+"</option>"));      
    }
    ship_builder_guns[i] = select.val();
  }

  for (let i=0; i < 6; i++){
    let div = $("#weaponSelections > div:nth-of-type("+(i+1)+")");
    if (i+1 > n_guns){
      div.hide();
    }
    else
      div.show();
  } 


  for (let i=0; i < ammo_dataset.getNOfRows(); i++){
    $("#weaponSelections > div > select:nth-of-type(2)").append($("<option>"+ammo_dataset.getDatasetCell(i, 1)+"</option>"));
  }


  // Update ship stats
  let ship_stats = ship_dataset.filterByString(ship_builder_ship, "Ship Type");
  $("#shipStatArmor").text(ship_stats.getFirstCellByTitle("Armor") + " hp");
  $("#shipStatHull").text(ship_stats.getFirstCellByTitle("Hull Health") + " hp");
  $("#shipStatSpeed").text(ship_stats.getFirstCellByTitle("Longitudinal Speed, (m/s)") + " m/s");
  $("#shipStatAccel").text(ship_stats.getFirstCellByTitle("Longitudinal Acceleration, (m/s²)") + " m/s²");
  $("#shipStatVertSpeed").text(ship_stats.getFirstCellByTitle("Vertical Speed, (m/s)") + " m/s");
  $("#shipStatVertAccel").text(ship_stats.getFirstCellByTitle("Vertical Acceleration, (m/s²)") + " m/s²");
  $("#shipStatTurnSpeed").text(ship_stats.getFirstCellByTitle("Turn Speed, (deg/s)") + " deg/s");
  $("#shipStatTurnAccel").text(ship_stats.getFirstCellByTitle("Turn Acceleration,(deg/s²)") + " deg/s²");
  $("#shipStatMass").text(ship_stats.getFirstCellByTitle("Mass, (t)") + " t");
  
}

var updateShipBuildImageLock = false;
var updateShipBuildQueued = false;
function updateShipBuildImage(resetPos=false, important=false){
  if (!(gun_dataset && ammo_dataset && ship_dataset && ship_guns_dataset && component_dataset)) {
    setTimeout(function(){ updateShipBuildImage(); }, 1000);
    return;
  }
  if (updateShipBuildQueued) updateShipBuildQueued = true;
  if (updateShipBuildImageLock) return;
  updateShipBuildImageLock = true;

  let data_row = ship_guns_dataset.filterByString(ship_builder_ship, "Ship").getDatasetRow(0);
  let n_guns = parseInt(data_row[1]);
  let img_srcs = [ship_image_srcs[ship_builder_ship]];
  for (let i=0; i < n_guns; i++){
    img_srcs.push("gun-images/icons/"+ship_builder_guns[i]+".jpg");
  }
  let images = loadImages(img_srcs, () => {
    redrawShipBuildImage(images, data_row, resetPos);
    if (updateShipBuildQueued){
      updateShipBuildQueued = false;
      updateShipBuildImage(true);
    }});
}

function redrawShipBuildImage(images, data_row, resetPos=false){
  let canvas = document.getElementById("shipBuilderCanvas");
  let ctx = canvas.getContext("2d");
  if (resetPos){
    resetMatrix(builder_matrix);
    translateMatrix(builder_matrix, canvas.width/2 - images[0].width/2, canvas.height/2 - images[0].height/2);
    zoomMatrixAround(builder_matrix, canvas.width/2, canvas.height/2, 0.8);
    applyMatrix(ctx, builder_matrix);
  }
    


  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // let img = document.getElementById("shipBuilderImage");
  ctx.globalAlpha = 1;
  ctx.drawImage(images[0], 0, 0);

  if ($("#darkModeSwitch")[0].checked) {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;
    for (let i=0; i < data.length; i+=4){
      data[i] = 255-data[i];
      data[i+1] = 255-data[i+1];
      data[i+2] = 255-data[i+2];
    }
    ctx.putImageData(imageData, 0, 0);
  }
  

  // let data_row = ship_guns_dataset.filterByString(ship_builder_ship, "Ship").getDatasetRow(0);

  let n_guns = parseInt(data_row[1]);

  for (let i=0; i < n_guns; i++){

    let gun_type = ship_builder_guns[i];
    let ammo_type = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(2)").val();
    let gun_numbers = getGunNumbers(gun_type, ammo_type, false);


    let gun_angle = gun_numbers.info.angle;

    let angle = degToRad(-90 + parseFloat(data_row[2+i]));
    let right_angle = angle + degToRad(gun_angle);
    let left_angle = angle - degToRad(gun_angle);

    // let range = gun_numbers.info.range;

    let [cx, cy] = pointStringToInts(data_row[8+i])

    //Draw position
    ctx.globalCompositeOperation = "source-over";
    // ctx.fillStyle = "rgb(30, 150, 30)";
    // ctx.globalAlpha = 1;
    // ctx.beginPath();
    // ctx.rect(cx-10, cy-10, 20, 20); 
    // ctx.fill();
    // ctx.stroke();
    // console.log(gun_img.src);
    // gun_img.src = "gun-images/icons/"+gun_type+".jpg";
    // if (gun_img.src == "http://localhost/gun-images/icons/Artemis.jpg") gun_img.src = "gun-images/icons/Light Flak.jpg"
    // else if (gun_img.src == "http://localhost/gun-images/icons/Light%20Flak.jpg") gun_img.src = "gun-images/icons/Artemis.jpg"
    ctx.drawImage(images[i+1], cx-30, cy-30, 60, 60);
    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.font = "20px Arial";
    ctx.textAlign = "center"; 
    ctx.fillText(i+1, cx, cy+8);

    let offscreen = document.querySelector("#shipBuilderCanvasOffscreen");
    let off_ctx = offscreen.getContext('2d');
    // off_ctx.clearRect(0, 0, offscreen.width, offscreen.height);

    off_ctx.save();
    off_ctx.setTransform(1, 0, 0, 1, 0, 0);
    off_ctx.clearRect(0, 0, canvas.width, canvas.height);
    off_ctx.restore();

    // off_ctx.setTransform(ctx.getTransform());
    applyMatrix(off_ctx, builder_matrix);


    //Draw arc
    off_ctx.fillStyle = "rgb(50, 50, 50)";
    if ($("#darkModeSwitch")[0].checked) off_ctx.fillStyle = "rgb(200, 200, 200)";
    off_ctx.globalAlpha = 0.3;
    off_ctx.globalCompositeOperation = "source-over";

    off_ctx.beginPath();
    off_ctx.moveTo(cx,cy);
    off_ctx.arc(cx, cy, gun_numbers.info.range/0.09375, left_angle, right_angle);
    off_ctx.lineTo(cx,cy);
    off_ctx.fill();


    //Clear arc inside arming range, leave a bit at the edges
    off_ctx.globalAlpha = 1;
    off_ctx.globalCompositeOperation = "destination-out";
    off_ctx.beginPath();
    let cx2 = cx + Math.cos(left_angle/2+right_angle/2)*5;
    let cy2 = cy + Math.sin(left_angle/2+right_angle/2)*5;

    off_ctx.moveTo(cx2, cy2);
    off_ctx.arc(cx2, cy2, gun_numbers.info["arming distance"]/0.128, left_angle, right_angle);
    off_ctx.lineTo(cx2, cy2);
    off_ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
  }
  updateShipBuildImageLock=false;
}

function updateRangeVis(){
    if (!(gun_dataset && ammo_dataset && ship_dataset && map_dataset && component_dataset)) {
      setTimeout(function(){ updateRangeVis(); }, 1000);
      return;
    }


    // Range canvas
    let canvas = document.getElementById("rangeCanvas");
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let dark_mode = $("#darkModeSwitch")[0].checked;

    var pad_left = 250.5;
    var pad_top = 80.5;
    let [bw, bh] = [500, 500]//[canvas.width-pad_left-pad_right, canvas.height-pad_bot-pad_top];

    let ship_data = ship_guns_dataset.filterByString(ship_builder_ship, "Ship").getDatasetRow(0);
    let n_guns = parseInt(ship_data[1]);

    // Find longest range in different directions
    let front_range = 500;
    let back_range = 500;
    let side_range = 500;

    
    for (let i=0; i < n_guns; i++){
        let gun_type = ship_builder_guns[i];
        if (gun_type == "None") continue;
        let ammo_type = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(2)").val();
        let gun_numbers = getGunNumbers(gun_type, ammo_type, false);
        let range = gun_numbers.info.range;
        let side_angle = degToRad(gun_numbers.info.angle);
        let initial_angle = degToRad(parseFloat(ship_data[2+i]));


        let diff_front = angleDifference(initial_angle, 0);
        let diff_back = angleDifference(initial_angle, Math.PI);
        let diff_side = Math.min(angleDifference(initial_angle, Math.PI/2), angleDifference(initial_angle, -Math.PI/2));

        if (diff_front < side_angle) front_range = Math.max(front_range, range);
        else{
          let angle_diff = Math.min(angleDifference(initial_angle-side_angle, 0), angleDifference(initial_angle+side_angle, 0))
          front_range = Math.max(Math.cos(angle_diff)*range, front_range);
        }
        if (diff_back < side_angle) back_range = Math.max(back_range, range);
        else{
          let angle_diff = Math.min(angleDifference(initial_angle-side_angle, Math.PI), angleDifference(initial_angle+side_angle, Math.PI))
          back_range = Math.max(Math.cos(angle_diff)*range, back_range);
        }
        if (diff_side < side_angle) side_range = Math.max(side_range, range);
        else{
          let angle_diff = Math.min(angleDifference(initial_angle+side_angle, Math.PI/2), angleDifference(initial_angle-side_angle, -Math.PI/2));
          side_range = Math.max(Math.abs(Math.cos(angle_diff)*range), side_range);
        }
    }

    front_range = Math.ceil(front_range/500)*500;
    back_range = Math.ceil(back_range/500)*500;
    side_range = Math.ceil(side_range/500)*500;
    // let added_front = false;
    while(front_range+back_range < side_range*2){
      front_range += 500;
      // if (added_front) front_range += 500;
      // else back_range += 500;
      // added_front = !added_front;
    }
    if ((front_range+back_range)%1000 != 0) front_range+=500;

    let scale = bh / (front_range + back_range);
    let size = front_range+back_range;

    // Draw background graph
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";
    if (dark_mode) {
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#ffffff";
    }
    ctx.beginPath();
    ctx.font = "15px Arial"; 
    ctx.textAlign = "center";
    for (var x = 0; x <= size; x += 500) {
      ctx.moveTo(x*scale + pad_left, pad_top);
      ctx.lineTo(x*scale + pad_left, bh + pad_top);
      ctx.fillText(precise(x-size/2, 2), x*scale + pad_left, bh + pad_top + 16); 
    }

    ctx.textAlign = "end";
    for (var x = 0; x <= size; x += 500) {
      ctx.moveTo(pad_left, x*scale + pad_top);
      ctx.lineTo(bw + pad_left, x*scale + pad_top);
      ctx.fillText(precise(size-x-size*(back_range/(front_range+back_range)), 2), pad_left - 2, x*scale + pad_top + 5); 
    }
    ctx.setLineDash([1, 4]);
    ctx.stroke();

    // Draw box around
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.rect(pad_left, pad_top, bw, bh);
    ctx.stroke();

    // Draw title
    ctx.font = "20px Arial"; 
    ctx.textAlign = "center"; 
    ctx.fillText(ship_builder_ship, canvas.width/2, 20); 
    // ctx.fillText(ship_builder_ship, canvas.width/2, 20);

    // Draw gun descriptions
    let gun_descriptions = [];
    for (let i=0; i < n_guns; i++){
      if (ship_builder_guns[i] == "None") continue;
      let gun_type = ship_builder_guns[i];
      let ammo_type = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(2)").val();
      gun_descriptions.push(gun_type+"("+ammo_type+")");
    }
    ctx.textAlign = "left";
    let text_width_1 = ctx.measureText(gun_descriptions.slice(0, 3).join(" ")).width;
    let text_width_2 = ctx.measureText(gun_descriptions.slice(3, 6).join(" ")).width;
    let left_x_1 = canvas.width/2 - text_width_1/2;
    let left_x_2 = canvas.width/2 - text_width_2/2;
    
    for (let i=0; i < gun_descriptions.length; i++){
      ctx.fillStyle = gun_colors[i];
      if (i>=3){
        ctx.fillText(gun_descriptions[i], left_x_2, 62);
        left_x_2 += ctx.measureText(gun_descriptions[i]+" ").width;
      }
      else {
        ctx.fillText(gun_descriptions[i], left_x_1, 40);
        left_x_1 += ctx.measureText(gun_descriptions[i]+" ").width;
      }
    }


    // Draw gun arcs
    let cx = pad_left + scale*size/2;
    let cy = pad_top + scale*(size-size*(back_range/(front_range+back_range)));

    for (let i=0; i < n_guns; i++){
      let gun_type = ship_builder_guns[i];
      if (gun_type == "None") continue;
      let ammo_type = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(2)").val();
      let gun_numbers = getGunNumbers(gun_type, ammo_type, false);
      let range = gun_numbers.info.range;
      let side_angle = degToRad(gun_numbers.info.angle);
      let initial_angle = -Math.PI/2 + degToRad(parseFloat(ship_data[2+i]));

      // let [gx, gy] = pointStringToInts(ship_data[8+i])
      // gx = cx + gx*scale;
      // gy = cy + gy*scale;
      let [gx, gy] = [cx, cy];

      ctx.strokeStyle = gun_colors[i];
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(gx,gy);
      ctx.arc(gx, gy, range*scale, initial_angle-side_angle, initial_angle+side_angle);
      ctx.lineTo(gx,gy);
      ctx.stroke();

      ctx.setLineDash([10, 4, 1, 4]);
      ctx.beginPath();
      ctx.moveTo(gx,gy);
      ctx.lineTo(gx+range*scale*Math.cos(initial_angle),gy+range*scale*Math.sin(initial_angle));
      ctx.stroke();

    }
    


    
    

}