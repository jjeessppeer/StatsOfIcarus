

var ship_builder_guns = ["None", "None", "None", "None", "None", "None"];
var ship_builder_ship = "Mobula";


var build_last_pos_x = undefined;
var build_last_pos_y = undefined;


function initializeShipBuilder(){
  shipBuilderReloadGuns();

  updateShipBuildImage();
  updateRangeVis();
  console.log("GUNS INITIALZIED");

  // $('#shipBuilderCanvas').mousedown(shipCanvasClicked);

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
    // console.log(factor);


    let [pos_x, pos_y] = [e.originalEvent.layerX, e.originalEvent.layerY];
    let [x, y] = transformPoint(pos_x, pos_y, ctx.getTransform());
    ctx.translate(x, y);
    ctx.scale(factor,factor);
    ctx.translate(-x, -y);
    
    updateShipBuildImage();
    return false;
  })

  // $('#rangeCanvas').mousemove(function(event){
  //   // var x = event.layerX;
  //   // var y = event.layerY;
    
  //   let [x, y] = [event.pageX - $(this).offset().left, event.pageY - $(this).offset().top];
  //   let rangeCanvas = document.getElementById("rangeCanvas");
  //   let ctx = rangeCanvas.getContext("2d");
  //   // console.log(x, ", ", y)
  //   var pixel = ctx.getImageData(x, y, 1, 1);
  //   var data = pixel.data;
  //   var rgba = 'rgba(' + data[0] + ', ' + data[1] +
  //              ', ' + data[2] + ', ' + data[3] + ')';
  //   console.log(rgba)
  // });

  $("#weaponSelections select:nth-of-type(1)").on("change", function(e){
    ship_builder_guns[$(this).parent().index()/2] = $(this).val();
    console.log(ship_builder_guns);
    updateShipBuildImage();
    updateRangeVis();


    // shipBuilderLoad("Mobula,Artemis,Mercury,Mercury,Mercury,Mercury,Mercury")
  });

  $("#shipBuildExportButton").on("click", shipBuilderExport);
  $("#shipBuildImportButton").on("click", shipBuilderImport);
}


function shipBuilderImport(){
  let build_code = $("#shipBuildImportText").val();
  build_code = atob(build_code);
  build_code = build_code.split(",");
  ship_builder_ship = build_code[0];

  shipBuilderReloadGuns();

  ship_builder_guns = build_code.slice(1,7);
  for (let i=0; i < ship_builder_guns.length; i++){
    let select = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select:nth-of-type(1)");
    select.val(ship_builder_guns[i]);
  }
  updateShipBuildImage();
  updateRangeVis();
}

function shipBuilderExport(){
  let export_string = ship_builder_ship + "," + ship_builder_guns.join();
  console.log(export_string);
  export_string = btoa(export_string);
  console.log(export_string);
  // export_string = en(export_string);
  // console.log(export_string);
  // export_string = base64EncodeUnicode(export_string);
  
  $("#shipBuildImportText").val(export_string);
}

function shipBuilderReloadGuns(){
  if (!(gun_dataset && ammo_dataset && ship_dataset && ship_guns_dataset && map_dataset)) {
    console.log("Still loading");
    setTimeout(function(){ shipBuilderReloadGuns(); }, 1000);
    return;
  }
  ship_builder_guns.fill("None");
  
  let ship_data = ship_guns_dataset.filterByString("Mobula", "Ship").getDatasetRow(0);
  let n_guns = parseInt(ship_data[1]);
  for (let i=0; i < n_guns; i++){
    
    console.log(i);
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

// function shipCanvasClicked(event){
//   if(!event) event = window.event;  
//
//   let click_pos = [event.pageX - $(this).offset().left, event.pageY - $(this).offset().top];
//   var x = event.pageX - $(this).offset().left;  
//   var y = event.pageY - $(this).offset().top;   
//   console.log(x, ", ", y, " : ", click_pos);
//   var styles = {
//           "left" : x, 
//           "top" : y
//   };
// 
// 
//   let data_row = ship_guns_dataset.filterByString("Mobula", "Ship").getDatasetRow(0);
//   let n_guns = parseInt(data_row[1]);
//   let gun_i = -1;
//   for (let i=0; i < n_guns; i++){
//     if (dist2D([x, y], pointStringToInts(data_row[8+i])) < 10) gun_i = i; 
//   }
//   console.log("N guns: ", gun_i);
// 
// 
//   let available_guns = gun_dataset.filterByString(data_row[14+gun_i], "Weapon slot");
//   $("#shipBuildGunSelector").empty();
//   for (let i=0; i < available_guns.getNOfRows(); i++){
//     console.log(available_guns.getDatasetCell(i, 1));
//     let btn = $('<button type="button" class="btn btn-secondary text-left">'+available_guns.getDatasetCell(i, 1)+'</button>')
//     $("#shipBuildGunSelector").append(btn)
//   }
// 
// 
//   if (gun_i == -1){
//     $("#shipBuildGunSelector").hide();
//     return;
//   }
// 
//   $("#shipBuildGunSelector").show();
//   $("#shipBuildGunSelector").css("left", x);
//   $("#shipBuildGunSelector").css("top", y);
//   // $("#shipBuildGunSelector").hide();
//   // var template = $("#shipBuildGunSelector");
//   // $(template).css( styles ) 
//   // .show();  
//   // $(template).remove(); 
//   // $(this).append(template); 
// }


function updateShipBuildImage(){
  if (!(gun_dataset && ammo_dataset && ship_dataset && ship_guns_dataset)) {
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

  let data_row = ship_guns_dataset.filterByString("Mobula", "Ship").getDatasetRow(0);

  let n_guns = parseInt(data_row[1]);

  for (let i=0; i < n_guns; i++){

    let gun_type = ship_builder_guns[i];

    let gun_numbers = getGunNumbers(gun_type, "Normal", false);


    let gun_angle = gun_numbers.info.angle;

    let angle = degToRad(-90 + parseFloat(data_row[2+i]));
    let right_angle = angle + degToRad(gun_angle);
    let left_angle = angle - degToRad(gun_angle);

    let range = gun_numbers.info.range;

    let [cx, cy] = pointStringToInts(data_row[8+i])

    //Draw position
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgb(30, 150, 30)";
    ctx.globalAlpha = 1;
    ctx.beginPath();      
    ctx.arc(cx, cy, 7, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();

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

    //Clear arc
    off_ctx.globalAlpha = 1;
    off_ctx.globalCompositeOperation = "destination-out";
    off_ctx.beginPath();
    off_ctx.moveTo(cx,cy);
    off_ctx.arc(cx, cy, gun_numbers.info["arming distance"]/0.128, left_angle, right_angle);
    off_ctx.lineTo(cx,cy);
    off_ctx.fill();


    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();
  }
}

function updateRangeVis(){
    if (!(gun_dataset && ammo_dataset && ship_dataset && map_dataset)) {
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

    let ship_data = ship_guns_dataset.filterByString("Mobula", "Ship").getDatasetRow(0);
    let n_guns = parseInt(ship_data[1]);

    let cy = 250;
    let cx = 200;

    for (let i=0; i < ship_builder_guns.length; i++){
      let gun_type = ship_builder_guns[i];
      if (gun_type == "None") continue;
      let ammo_type = "Normal";

      let proj_speed_mod = parseFloat(ammo_dataset.getCellByString(ammo_type, "Alias", "Projectile speed"));
      let proj_speed = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Projectile speed")) * proj_speed_mod;

      let range = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Range")) * proj_speed_mod;
      let arming_range = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Arming time")) * proj_speed;

      let range_px = range/map_scale;
      let arming_range_px = arming_range/map_scale;
      let side_angle = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Side angle"));
      
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


      console.log("donezo");
      
      
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