
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

  // trigonometry yo

function getProjectileArc(speed, angle, start_height, drop, start, end, steps) {
  // Return list of points containing the projectile arc.
  let points = [];
  for (let i = 0; i < steps; i++) {
      let t = start + (end - start) * i / steps;
      points.push(projectilePos(t, speed, angle, drop, start_height));
  }
  return points;
}

function projectilePos(t, speed, angle, drop, start_height) {
  // Return projectile position after t seconds
  return [speed * Math.cos(angle) * t,
  speed * Math.sin(angle) * t - drop / 2 * Math.pow(t, 2) + start_height];
}

function tAtHit(speed, angle, target_x) {
  // Return time that projectile reaches target
  return target_x / (speed * Math.cos(angle));
}

function searchAngle(start_point, target_point, speed, drop) {
  // Return angle required to hit point.
  let x_dist = dist2D(start_point, target_point);
  let start_height = start_point[2];
  let target_height = target_point[2];


  let y;
  let angle = - Math.PI / 2;
  let angle_step = Math.PI / 50;
  let max_loops = Math.PI / angle_step + 2;
  let loops = 0;

  // First find out if target is reachable, and figure out rough angle
  do {
      if (loops > max_loops) {
          console.log("Hit not possible.");
          return 0;
          // break;
      }
      loops++;

      let t = tAtHit(speed, angle, x_dist);
      y = projectilePos(t, speed, angle, drop, start_height)[1];
      angle += angle_step;
      // console.log("Testing angle: ", precise(angle/Math.PI,3), " : ", precise(y, 3), " : ", precise(target_point[1], 3))

  } while (y < target_height);
  angle -= angle_step;

  // Search for correct angle
  let a1 = angle;
  let a2 = angle - angle_step;
  for (i = 0; i < 5; i++) {
      let a3 = (a1 + a2) / 2;
      let t1 = tAtHit(speed, a1, x_dist);
      let t2 = tAtHit(speed, a2, x_dist);
      let t3 = tAtHit(speed, a3, x_dist);

      let d1 = projectilePos(t1, speed, a1, drop, start_height)[1] - target_height;
      let d2 = projectilePos(t2, speed, a2, drop, start_height)[1] - target_height;
      let d3 = projectilePos(t3, speed, a3, drop, start_height)[1] - target_height;

      if (d3 > 0 && d3 < d1) a1 = a3;
      else if (d3 < 0 && d3 > d2) a2 = a3;
      else {
          console.log("Middle angle worst");
          break;
      }
  }

  let t = tAtHit(speed, a1, target_point[0]);
  y = projectilePos(t, speed, a1, drop, start_height)[1];

  // console.log("Angle refined: ", a1, " : ", y, " : ", precise(target_point[1], 3));
  return a1;
  // return getProjectileArc(speed, a1, start_height, drop, 0, tAtHit(speed, a1, target_point[0]), 100);
}

function dist2D(p1, p2) {
  let d_x = p1[0] - p2[0];
  let d_y = p1[1] - p2[1];
  return Math.sqrt(d_x * d_x + d_y * d_y);
}

function runOnComplete(object, callback) {
  if (object.complete) {
      callback(object);
  } else {
      object.addEventListener('load', function () { callback(object) });
      object.addEventListener('error', function () {
          alert('error');
      })
  }
}