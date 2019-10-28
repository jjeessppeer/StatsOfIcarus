

var ship_builder_guns = ["None", "None", "None", "None", "None", "None"];

function initializeShipBuilder(){



  shipBuilderShipChanged();

  updateShipBuildImage();
  updateRangeVis();
  console.log("GUNS INITIALZIED");

  $('#shipBuilderCanvas').mousedown(shipCanvasClicked);

  $("#weaponSelections select").on("change", function(e){
    ship_builder_guns[$(this).parent().index()/2] = $(this).val();
    console.log(ship_builder_guns);
    updateShipBuildImage();
  });
}


function shipBuilderShipChanged(){
  if (!(gun_dataset && ammo_dataset && ship_dataset && ship_guns_dataset && map_dataset)) {
    console.log("Still loading");
    setTimeout(function(){ shipBuilderShipChanged(); }, 1000);
    return;
  }
  ship_builder_guns.fill("None");
  
  let ship_data = ship_guns_dataset.filterByString("Mobula", "Ship").getDatasetRow(0);
  let n_guns = parseInt(ship_data[1]);
  console.log(n_guns);
  for (let i=0; i < n_guns; i++){
    
    console.log(i);
    let available_guns = gun_dataset.filterByString(ship_data[14+i], "Weapon slot");
    let select = $("#weaponSelections > div:nth-of-type("+(i+1)+") > select");
    select.empty();
    for (let j=0; j < available_guns.getNOfRows(); j++){
      select.append($("<option>"+available_guns.getDatasetCell(j, 1)+"</option>"));      
    }
    ship_builder_guns[i] = select.val();
  }
  console.log(ship_builder_guns)
}






function shipCanvasClicked(event){
  if(!event) event = window.event;  
  
  let click_pos = [event.pageX - $(this).offset().left, event.pageY - $(this).offset().top];
  var x = event.pageX - $(this).offset().left;  
  var y = event.pageY - $(this).offset().top;   
  console.log(x, ", ", y, " : ", click_pos);
  var styles = {
          "left" : x, 
          "top" : y
  };


  let data_row = ship_guns_dataset.filterByString("Mobula", "Ship").getDatasetRow(0);
  let n_guns = parseInt(data_row[1]);
  let gun_i = -1;
  for (let i=0; i < n_guns; i++){
    if (dist2D([x, y], pointStringToInts(data_row[8+i])) < 10) gun_i = i; 
  }
  console.log("N guns: ", gun_i);


  let available_guns = gun_dataset.filterByString(data_row[14+gun_i], "Weapon slot");
  $("#shipBuildGunSelector").empty();
  for (let i=0; i < available_guns.getNOfRows(); i++){
    console.log(available_guns.getDatasetCell(i, 1));
    let btn = $('<button type="button" class="btn btn-secondary text-left">'+available_guns.getDatasetCell(i, 1)+'</button>')
    $("#shipBuildGunSelector").append(btn)
  }


  if (gun_i == -1){
    $("#shipBuildGunSelector").hide();
    return;
  }

  $("#shipBuildGunSelector").show();
  $("#shipBuildGunSelector").css("left", x);
  $("#shipBuildGunSelector").css("top", y);
  // $("#shipBuildGunSelector").hide();
  // var template = $("#shipBuildGunSelector");
  // $(template).css( styles ) 
  // .show();  
  // $(template).remove(); 
  // $(this).append(template); 
}


function updateShipBuildImage(){
  if (!(gun_dataset && ammo_dataset && ship_dataset && ship_guns_dataset)) {
    console.log("Still loading");
    setTimeout(function(){ updateShipBuildImage(); }, 1000);
    return;
  }
  console.log("DRAWING STYUFF")

  let canvas = document.getElementById("shipBuilderCanvas");
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  let data_row = ship_guns_dataset.filterByString("Mobula", "Ship").getDatasetRow(0);

  let n_guns = parseInt(data_row[1]);

  for (let i=0; i < n_guns; i++){

    let gun_type = ship_builder_guns[i];
    let gun_angle = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Side angle"));

    let angle = degToRad(90 + parseInt(data_row[2+i]));
    let right_angle = angle + degToRad(gun_angle);
    let left_angle = angle - degToRad(gun_angle);
    // let [cx, cy] = 100;


    let [cx, cy] = pointStringToInts(data_row[8+i])
    //Draw position
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgb(30, 255, 100)";
    // ctx.fillStyle = randomRGB();
    ctx.globalAlpha = 1;
    ctx.beginPath();      
    ctx.arc(cx, cy, 7, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();

    //Draw arc
    ctx.beginPath();
    ctx.globalAlpha = 0.3;
    ctx.moveTo(cx,cy);
    ctx.arc(cx, cy, 1000, left_angle, right_angle);
    ctx.lineTo(cx,cy);
    ctx.fill();
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
    //ctx.clearRect(0, 0, rangeCanvas.width, rangeCanvas.height);
    
    // TODO wrong image
    let map_image = document.querySelector("#mapImage");
    let map_scale = map_dataset.getCellByString($("#arcMapSelect").val(), "Name", "Map scale (m/px)") / (map_image.width / map_image.naturalWidth);
    


    let ship_data = ship_guns_dataset.filterByString("Mobula", "Ship").getDatasetRow(0);
    let n_guns = parseInt(ship_data[1]);

    // for (let i=0; i < ship_builder_guns.length; i++){
    //   let gun_type = ship_builder_guns[i];
    //   let ammo_type = "Charged";

    // }


    let gun_type = "Lumberjack";
    let ammo_type = "Charged";
    

    let proj_speed_mod = parseFloat(ammo_dataset.getCellByString(ammo_type, "Alias", "Projectile speed"));
    let proj_speed = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Projectile speed")) * proj_speed_mod;


    let range = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Range")) * proj_speed_mod;
    let arming_range = parseFloat(gun_dataset.getCellByString(gun_type, "Alias", "Arming time")) * proj_speed;
    
    console.log("Speeds", proj_speed_mod, ", ", proj_speed, ", ", arming_range);
    let range_px = range/map_scale;
    let arming_range_px = arming_range/map_scale;
    let side_angle = gun_dataset.getCellByString("Gatling", "Alias", "Side angle");

    let cy = 300;
    let cx = 200;

    let initial_angle = -Math.PI/2
    
    
    //ctx.stroke(); // or context.fill()
    
    ctx.fillStyle = "red";
    ctx.globalAlpha = 0.5;

    //Draw arc
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx, cy, range_px, -Math.PI / 180.0 * side_angle + initial_angle, Math.PI / 180.0 * side_angle + initial_angle);
    ctx.lineTo(cx,cy);
    ctx.fill();

    //Draw arc
    ctx.globalAlpha =1;
    ctx.beginPath();
    ctx.globalCompositeOperation = "destination-out";
    ctx.moveTo(cx,cy);
    ctx.arc(cx, cy, arming_range_px, -Math.PI / 180.0 * side_angle + initial_angle, Math.PI / 180.0 * side_angle + initial_angle);
    ctx.lineTo(cx,cy);
    ctx.fill();


    //Draw position
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "blue";
    ctx.globalAlpha = 1;
    ctx.beginPath();      
    ctx.arc(cx, cy, 10, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
    console.log("GUNARC", arming_range, ", ", range);

  }