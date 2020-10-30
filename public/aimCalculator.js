
// Aim calculator variables
var start_point = [100, 100, 100];
var target_point = [200, 200, 100];

function initializeAimCalculator(){
    $('#mapImage').on('dragstart', function (event) { event.preventDefault(); });
    // Aim calculator events
    $("#mapCanvas").on("mousemove mousedown", function (e) {
        if (e.buttons != 1) return;
        let click_pos = [e.pageX - $(this).offset().left, this.width - e.pageY + $(this).offset().top];

        if (dist2D(target_point, click_pos) < dist2D(start_point, click_pos)) {
          target_point[0] = click_pos[0];
          target_point[1] = click_pos[1];
        }
        else {
          start_point[0] = click_pos[0];
          start_point[1] = click_pos[1];
        }
        updateArcPanel();
    });

    $("#arcCanvas").on("mousemove mousedown", function (e) {
        if (e.buttons != 1) return;
        let click_pos = [20 + e.pageX - $(this).offset().left, this.width - e.pageY + $(this).offset().top];
        let target_2d = [dist2D(target_point, start_point) + 20, target_point[2]];
        let start_2d = [20, start_point[2]];

        if (dist2D(target_2d, click_pos) < dist2D(start_2d, click_pos)) {
          target_point[2] = click_pos[1];
        }
        else {
          start_point[2] = click_pos[1];
        }
        updateArcPanel();
    });

    $("#arcAmmoSelect").on("change", function () { updateArcPanel(); });

    $("#arcGunSelect").on("change", function () {
        let gun_srcs = { "Lumberjack": "images/gun-images/lumberjack.jpg", "Heavy Flak Mk. II": "images/gun-images/flak.jpg", "Hades": "images/gun-images/lumberjack.jpg" };
        let gun_image = $("#gunImage")[0];
        gun_image.src = gun_srcs[$(this).val()];
        runOnComplete(gun_image, function (gun_image) {
          let gun_canvas = document.querySelector("#gunCanvas");
          let image_height = 400;
          let image_scale = image_height / gun_image.naturalHeight;
          gun_image.height = image_height;
          gun_canvas.height = image_height;
          gun_image.width = gun_image.naturalWidth * image_scale;
          gun_canvas.width = gun_image.naturalWidth * image_scale;
          updateArcPanel();
        })
      });

    $("#arcMapSelect").on("change", function () {
        let map_srcs = { "Battle on the Dunes": "images/map-images/Dunes.jpg", "Northern Fjords": "images/map-images/Fjords.jpg" };
        $("#mapImage").attr("src", map_srcs[$(this).val()]);
        updateArcPanel();
    });

    updateArcPanel();
}

function updateArcPanel() {
    if (!(gun_dataset && ammo_dataset && ship_dataset && crosshair_dataset && map_dataset)) {
      setTimeout(function () { updateArcPanel(); }, 1000);
      return;
    }

    // start_point and target_point are 3d points with canvas-local coordinates
    // must be scaled to world coords
    // Get world coords
    let map_image = document.querySelector("#mapImage");
    let map_scale = map_dataset.getCellByString($("#arcMapSelect").val(), "Name", "Map Scale") / (map_image.width / map_image.naturalWidth);
    // console.log(map_dataset.getCellByString($("#arcMapSelect").val(), "Name", "Map scale (m/px)"))
    let arc_scale = 10;

    let world_target = [target_point[0] * map_scale, target_point[1] * map_scale, target_point[2] * arc_scale];
    let world_start = [start_point[0] * map_scale, start_point[1] * map_scale, start_point[2] * arc_scale];

    // Gun and ammo data
    let gun_type = $("#arcGunSelect").val();
    let ammo_type = $("#arcAmmoSelect").val();

    let speed = gun_dataset.getCellByString(gun_type, "Alias", "Projectile speed") * ammo_dataset.getCellByString(ammo_type, "Alias", "Projectile speed");
    // let drop = gun_dataset.getCellByString(gun_type, "Alias", "Shell drop") * ( 2 - ammo_dataset.getCellByString(ammo_type, "Alias", "Lift"));
    let drop = gun_dataset.getCellByString(gun_type, "Alias", "Shell drop")// * ammo_dataset.getCellByString(ammo_type, "Alias", "Lift");
    // console.log(drop);
    let angle = searchAngle(world_start, world_target, speed, drop);
    let target_dist = dist2D(world_start, world_target);

    // Map canvas
    let mapCanvas = document.getElementById("mapCanvas");
    let mapCtx = mapCanvas.getContext("2d");
    mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);

    mapCtx.beginPath();
    mapCtx.arc(target_point[0], mapCanvas.height - target_point[1], 10, 0, 2 * Math.PI, false);
    mapCtx.fillStyle = "red";
    mapCtx.fill();
    mapCtx.stroke();

    mapCtx.beginPath();
    mapCtx.arc(start_point[0], mapCanvas.height - start_point[1], 10, 0, 2 * Math.PI, false);
    mapCtx.fillStyle = "blue";
    mapCtx.fill();
    mapCtx.stroke();

    // Arc canvas
    let arcCanvas = document.getElementById("arcCanvas");
    let arcCtx = arcCanvas.getContext("2d");
    arcCtx.clearRect(0, 0, arcCanvas.width, arcCanvas.height);

    let data = getProjectileArc(speed, angle, world_start[2], drop, 0, tAtHit(speed, angle, target_dist), 100);
    arcCtx.strokeStyle = "white";
    
    if ($("#darkModeSwitch")[0].checked) arcCtx.strokeStyle = "white";
    else arcCtx.strokeStyle = "black";

    arcCtx.lineWidth = 3;
    for (let i = 0; i < data.length - 1; i++) {
      arcCtx.beginPath();
      arcCtx.moveTo(20 + data[i][0] / arc_scale, arcCanvas.height - data[i][1] / arc_scale);
      arcCtx.lineTo(20 + data[i + 1][0] / arc_scale, arcCanvas.height - data[i + 1][1] / arc_scale);
      arcCtx.stroke();
    }
    

    arcCtx.lineWidth = 1;
    arcCtx.beginPath();
    arcCtx.arc(20 + target_dist / arc_scale, arcCanvas.height - target_point[2], 4, 0, 2 * Math.PI, false);
    arcCtx.fillStyle = "red";
    arcCtx.fill();
    arcCtx.stroke();

    arcCtx.beginPath();
    arcCtx.arc(20, arcCanvas.height - start_point[2], 4, 0, 2 * Math.PI, false);
    arcCtx.fillStyle = "blue";
    arcCtx.fill();
    arcCtx.stroke();


    // Draw gun sight angle
    // (angle straight to target) - (angle gun has to aim) = angle in gun sights
    let laser_angle = Math.atan2((world_target[2] - world_start[2]), dist2D(world_start, world_target));
    let angle_diff = angle - laser_angle;

    let gun_image = document.querySelector("#gunImage");
    let gun_image_scale = (gun_image.width / gun_image.naturalWidth);


    let gun_sights_start_y = parseInt(crosshair_dataset.getCellByString(gun_type, "Name", "Start y")); // TODO base on gun
    let gun_sights_start_x = parseInt(crosshair_dataset.getCellByString(gun_type, "Name", "Start x"));
    let gun_sights_end_x = parseInt(crosshair_dataset.getCellByString(gun_type, "Name", "End x"));
    let gun_sights_px_per_rad = crosshair_dataset.getCellByString(gun_type, "Name", "Deg per pixel") * Math.PI / 180;
    let gun_sights_aim_y = gun_sights_start_y + angle_diff / gun_sights_px_per_rad;

    let gunCanvas = document.getElementById("gunCanvas");
    let gunCtx = gunCanvas.getContext("2d");
    gunCtx.clearRect(0, 0, gunCanvas.width, gunCanvas.height);
    gunCtx.beginPath();
    gunCtx.strokeStyle = "red";
    gunCtx.lineWidth = 4;
    gunCtx.moveTo(gun_sights_start_x * gun_image_scale, gun_sights_aim_y * gun_image_scale);
    gunCtx.lineTo(gun_sights_end_x * gun_image_scale, gun_sights_aim_y * gun_image_scale);
    gunCtx.stroke();

    // Update data table
    $("#arcTableTime").text(precise(tAtHit(speed, angle, target_dist), 2) + "s");
    $("#arcTableDistance").text(precise(target_dist, 3) + "m");
    $("#arcTableAngleRel").text(precise(angle_diff * 180 / Math.PI, 2) + "\u00B0");
    $("#arcTableAngleAbs").text(precise(angle * 180 / Math.PI, 2) + "\u00B0");
  }