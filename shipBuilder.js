

var ship_builder_guns = ["None", "None", "None", "None", "None", "None"];
var ship_builder_ship = "Corsair";


var build_last_pos_x = undefined;
var build_last_pos_y = undefined;



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
    console.log("Still loading");
    setTimeout(function(){ initializeShipBuilder(); }, 1000);
    return;
  }

  // Fill ship list
  for (let i=0; i < ship_guns_dataset.getNOfRows(); i++){
    let ship_name = ship_guns_dataset.getDatasetCell(i, 0);
    if (ship_name == "Corsair")
      $("#shipBuildShipSelection").append($("<option selected>"+ ship_guns_dataset.getDatasetCell(i, 0) +"</option>"));
    else
      $("#shipBuildShipSelection").append($("<option>"+ ship_guns_dataset.getDatasetCell(i, 0) +"</option>"));
  }
  

  $('#shipBuilderImage').bind("load", function(){
    console.log("IMAGE LOADED")
    let canvas = document.getElementById("shipBuilderCanvas");
    let ctx = canvas.getContext("2d");
    ctx.resetTransform();
    ctx.translate(canvas.width/2 - this.width/2, canvas.height/2 - this.height/2);
    ctx.zoomAround(canvas.width/2, canvas.height/2, 0.8);
    // ctx.scale(0.5,0.5);
    updateShipBuildImage();
  }); 

  $("#shipBuildName").on("input", shipBuilderUpdateUrl);

  // Ship change event
  $("#shipBuildShipSelection").on("change", function(e){
    ship_builder_ship = $(this).val();
    shipBuilderReloadShip();
    updateShipBuildImage();
    updateRangeVis();
    shipBuilderUpdateUrl()
  });

  shipBuilderReloadShip();
  updateShipBuildImage();
  updateRangeVis();

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
  crewRoleChanged();
  

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

    dx /= ctx.getTransform().a;
    dy /= ctx.getTransform().d;

    // console.log(ctx.getTransform().a);

    // let [dx, dy] = translatePoint()
    ctx.translate(dx, dy);
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
    ctx.zoomAround(pos_x, pos_y, factor);
    
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
    shipBuilderImport(null, getUrlParam(window.location.href));
  }
}

function shipBuilderUpdateUrl(){
  setUrlParam(shipBuilderGetExportCode());
}

function shipBuilderImport(e, build_code){
  if (!build_code)
    build_code = $("#shipBuildImportText").val();
  // build_code = atob(build_code);
  build_code = LZString.decompressFromEncodedURIComponent(build_code);
  build_code = build_code.split(",");

  ship_builder_ship = ship_builder_translations["Ship"][build_code[0]];
  $("#shipBuildShipSelection").val(ship_builder_ship);

  shipBuilderReloadShip();
  
  let gun_codes = build_code.slice(1, 7);
  for (let i=0; i < ship_builder_guns.length; i++){
    let select = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(1)");
    ship_builder_guns[i] = ship_builder_translations["Weapon"][gun_codes[i]];
    select.val(ship_builder_guns[i]);
  }

  let ammo_codes = build_code.slice(7, 13);
  for (let i=0; i < ammo_codes.length; i++){
    let select = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(2)");
    select.val(ship_builder_translations["Ammo"][ammo_codes[i]]);
  }

  let crew_codes = build_code.slice(13, 53);
  let imgs = $("#crewLoadouts button img");
  for (let i=0; i < crew_codes.length; i+=10){
    let selector = "Crew";
    if (i%10 >= 7) selector = "Ammo";
    else if (i%10 >= 4) selector = "EngiTool";
    else if (i%10 >= 1) selector = "PilotTool";
    imgs[i].src = "loadout-images/" + ship_builder_translations[selector][crew_codes[i]] + ".jpg";
  }

  $("#shipBuildName").val(build_code[53]);

  crewRoleChanged();
  updateShipBuildImage();
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

function shipBuilderGetExportCode(){


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
  for (let i=0; i < imgs.length; i+=10){
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
  }
  
  let export_string = ship_builder_translations["Ship"].indexOf(ship_builder_ship) + "," + guns.join() + "," + ammo_types.join() + "," + crew_selections.join() + "," + $("#shipBuildName").val();

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
    }
  }
}


function shipBuilderReloadShip(){

  $("#shipBuilderImage")[0].src = ship_image_srcs[ship_builder_ship];


  ship_builder_guns.fill("None");
  
  let ship_data = ship_guns_dataset.filterByString(ship_builder_ship, "Ship").getDatasetRow(0);
  let n_guns = parseInt(ship_data[1]);
  for (let i=0; i < n_guns; i++){
    let available_guns = gun_dataset.filterByString(ship_data[14+i], "Weapon slot");
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
  
}


function updateShipBuildImage(){
  if (!(gun_dataset && ammo_dataset && ship_dataset && ship_guns_dataset && component_dataset)) {
    console.log("Still loading");
    setTimeout(function(){ updateShipBuildImage(); }, 1000);
    return;
  }


  
  let canvas = document.getElementById("shipBuilderCanvas");
  let ctx = canvas.getContext("2d");
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  let img = document.getElementById("shipBuilderImage");
  ctx.globalAlpha = 1;
  ctx.drawImage(img, 0, 0);

  let data_row = ship_guns_dataset.filterByString(ship_builder_ship, "Ship").getDatasetRow(0);

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
    ctx.fillStyle = "rgb(30, 150, 30)";
    ctx.globalAlpha = 1;
    ctx.beginPath();      
    // ctx.arc(cx, cy, 12, 0, 2*Math.PI);
    ctx.rect(cx-10, cy-10, 20, 20); 
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.font = "20px Arial";
    ctx.textAlign = "center"; 
    ctx.fillText(i+1, cx, cy+8);

    // //Draw arc
    // ctx.fillStyle = "rgb(30, 50, 30)";
    // ctx.beginPath();
    // ctx.globalAlpha = 0.3;
    // ctx.moveTo(cx,cy);
    // ctx.arc(cx, cy, range/0.128, left_angle, right_angle);
    // ctx.lineTo(cx,cy);
    // ctx.fill();

    let offscreen = document.querySelector("#shipBuilderCanvasOffscreen");
    let off_ctx = offscreen.getContext('2d');
    // off_ctx.clearRect(0, 0, offscreen.width, offscreen.height);

    off_ctx.save();
    off_ctx.setTransform(1, 0, 0, 1, 0, 0);
    off_ctx.clearRect(0, 0, canvas.width, canvas.height);
    off_ctx.restore();

    off_ctx.setTransform(ctx.getTransform());
    //Draw arc
    off_ctx.fillStyle = "rgb(30, 50, 30)";
    off_ctx.globalAlpha = 0.3;
    off_ctx.globalCompositeOperation = "source-over";

    off_ctx.beginPath();
    off_ctx.moveTo(cx,cy);
    off_ctx.arc(cx, cy, gun_numbers.info.range/0.128, left_angle, right_angle);
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

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();
  }
}

function updateRangeVis(){
    if (!(gun_dataset && ammo_dataset && ship_dataset && map_dataset && component_dataset)) {
      console.log("Still loading");
      setTimeout(function(){ updateRangeVis(); }, 1000);
      return;
    }
    //TODO burst arc change

    // Map canvas
    let rangeCanvas = document.getElementById("rangeCanvas");
    let ctx = rangeCanvas.getContext("2d");
    ctx.clearRect(0, 0, rangeCanvas.width, rangeCanvas.height);
    
    // TODO wrong image
    let map_image = document.querySelector("#mapImage");
    let map_scale = parseFloat(map_dataset.getCellByString($("#arcMapSelect").val(), "Name", "Map scale (m/px)") / (map_image.width / map_image.naturalWidth));

    let ship_data = ship_guns_dataset.filterByString(ship_builder_ship, "Ship").getDatasetRow(0);
    let n_guns = parseInt(ship_data[1]);

    let cy = 250;
    let cx = 200;

    for (let i=0; i < ship_builder_guns.length; i++){
      let gun_type = ship_builder_guns[i];
      if (gun_type == "None") continue;

      let ammo_type = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(2)").val();
      let gun_numbers = getGunNumbers(gun_type, ammo_type, false);
      
      // let ammo_type = "Normal";

      // let proj_speed_mod = parseFloat(ammo_dataset.getCellByString(ammo_type, "Alias", "Projectile speed"));
      // let proj_speed = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Projectile speed")) * proj_speed_mod;

      // let range = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Range")) * proj_speed_mod;
      // let arming_range = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Arming time")) * proj_speed;

      let range = gun_numbers.info.range;
      let arming_range = gun_numbers.info["arming distance"];

      let range_px = range/map_scale;
      let arming_range_px = arming_range/map_scale;
      let side_angle = gun_numbers.info.angle;
      
      let initial_angle = -Math.PI/2 + degToRad(parseFloat(ship_data[2+i]));

      let offscreen = document.querySelector("#rangeCanvasOffscreen");
      let off_ctx = offscreen.getContext('2d');
      off_ctx.clearRect(0, 0, offscreen.width, offscreen.height);

      off_ctx.fillStyle = "rgb(128, 128, 128)";
      // off_ctx.fillStyle = "rgb(30, 255, 100)";
      off_ctx.globalAlpha = 1;

      //Draw arc
      off_ctx.beginPath();
      off_ctx.globalCompositeOperation = "source-over";
      off_ctx.moveTo(cx,cy);
      off_ctx.arc(cx, cy, range_px, -Math.PI / 180.0 * side_angle + initial_angle, Math.PI / 180.0 * side_angle + initial_angle);
      off_ctx.lineTo(cx,cy);
      off_ctx.fill();

      //Draw arc
      off_ctx.globalAlpha = 1;
      off_ctx.beginPath();
      off_ctx.globalCompositeOperation = "destination-out";
      off_ctx.moveTo(cx,cy);
      off_ctx.arc(cx, cy, arming_range_px, -Math.PI / 180.0 * side_angle + initial_angle, Math.PI / 180.0 * side_angle + initial_angle);
      off_ctx.lineTo(cx,cy);
      off_ctx.fill();

      let image_data_off = off_ctx.getImageData(0, 0, 400, 400);
      for (j=0; j<image_data_off.data.length; j+=4){
        if (image_data_off.data[j+3] != 255){
          image_data_off.data[j+0] = 0;
          image_data_off.data[j+1] = 0;
          image_data_off.data[j+2] = 0;
          image_data_off.data[j+3] = 0;
        } 
      }
      off_ctx.putImageData(image_data_off, 0, 0);
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(offscreen, 0, 0);
    }

    
    let image_data = ctx.getImageData(0, 0, 400, 400);

    for (i=0; i<image_data.data.length; i+=4){
      let color_val = image_data.data[i];
      if (color_val == 128) {
        image_data.data[i] = 0;
        image_data.data[i+1] = 100;
        image_data.data[i+2] = 255;
      }
      else if (color_val == 64){
        image_data.data[i] = 0;
        image_data.data[i+1] = 255;
        image_data.data[i+2] = 255;

      }
      else if (color_val == 32){
        image_data.data[i] = 200;
        image_data.data[i+1] = 255;
        image_data.data[i+2] = 50;

      }
      else if (color_val == 16){
        image_data.data[i] = 255;
        image_data.data[i+1] = 100;
        image_data.data[i+2] = 0;

      }
      else if (color_val == 8){
        image_data.data[i] = 200;
        image_data.data[i+1] = 0;
        image_data.data[i+2] = 0;

      }
      else if (color_val == 4){
        image_data.data[i] = 0;
        image_data.data[i+1] = 0;
        image_data.data[i+2] = 0;

      }
      else{
        image_data.data[i] = 0;
        image_data.data[i+1] = 0;
        image_data.data[i+2] = 0;
      }
      if (color_val != 0){
        image_data.data[i+3] = 200
      }
    }
    ctx.putImageData(image_data, 0, 0);

    // Draw ship image
    // ctx.globalCompositeOperation = "source-over";
    // let image = document.getElementById("shipBuilderImage");
    // let ship_w = 400 * 0.128 / map_scale;
    // let ship_h = 427 * 0.128 / map_scale;
    // ctx.drawImage(image, cx - ship_w/2, cy - ship_h/2, ship_w, ship_h);
    
    
    // Draw position
    // ctx.fillStyle = "blue";
    // ctx.globalAlpha = 1;
    // ctx.beginPath();      
    // ctx.arc(cx, cy, 10, 0, 2*Math.PI);
    // ctx.fill();
    // ctx.stroke();

    
    

}