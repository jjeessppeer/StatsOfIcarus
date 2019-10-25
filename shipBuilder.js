



function updateShipBuildImage(){
  if (!(gun_dataset && ammo_dataset && ship_dataset && ship_guns_dataset)) {
    console.log("Still loading");
    setTimeout(function(){ updateShipBuildImage(); }, 1000);
    return;
  }
  console.log("DRAWING STYUFF")

  let canvas = document.getElementById("shipBuilderCanvas");
  let ctx = canvas.getContext("2d");

  
  let data_row = ship_guns_dataset.filterByString("Mobula", "Ship").getDatasetRow(0);
  

  

  let n_guns = parseInt(data_row[1]);

  for (let i=0; i < n_guns; i++){

    let angle = degToRad(90 + parseInt(data_row[2+i]));
    let right_angle = angle + degToRad(60);
    let left_angle = angle - degToRad(60);
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