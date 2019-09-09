


function initializeDamageCalculator() {
    // Bind events
    $("#gunSelect,#ammoSelect,#buffedCheckbox,#armorUnitSelect,#hullUnitSelect,#balloonUnitSelect,#componentUnitSelect").on("change", updateGunInfoTable);

    // Update table
    updateGunInfoTable();
}

// function gunnerySelectionSubmitted() {
//     if (!(gun_dataset && ammo_dataset && damage_dataset && tool_dataset && component_dataset && ship_dataset)) {
//         console.log("Still loading");
//         return;
//     }
//     console.log("Changing gun selection");
//     let gunAlias = $("#gunSelect").val();
//     let ammoAlias = $("#ammoSelect").val();
//     updateGunInfoTable();
// }

function getGunNumbers(gunName, ammoName, distance = 0, chargeupTime = 0) {
    let buffed = $("#buffedCheckbox").is(':checked');
    let gun_type = $("#gunSelect").val();
    let ammo_type = $("#ammoSelect").val();

    let gun_data = gun_dataset.filterByString(gun_type, "Alias").getDatasetRow(0);
    let ammo_data = ammo_dataset.filterByString(ammo_type, "Alias").getDatasetRow(0);

    // Calculate stuff

    let clip_size = Math.max(1, Math.round(gun_data[8] * ammo_data[4]));
    let rate_of_fire = gun_data[6] * ammo_data[9];

    let range = gun_data[10] * ammo_data[10];
    let arming_distance = gun_data[15] * gun_data[9] * ammo_data[5] * ammo_data[10];
    let seconds_clip = Math.max((clip_size - 1) / rate_of_fire, 1); // Seconds per clip never below 1 
    let aoe = gun_data[13] * ammo_data[5];

    
    let info_dict = {
        "range": range, 
        "arming distance": arming_distance, 
        "seconds per clip": seconds_clip, 
        "clip size": clip_size, 
        "aoe": aoe};


    let damage_type_primary = gun_data[2];
    let damage_type_secondary = gun_data[4];

    let damage_hit_primary = gun_data[3] * ammo_data[7] * (buffed ? 1.2 : 1);
    let damage_hit_secondary = gun_data[5] * ammo_data[7] * ammo_data[6] * (buffed ? 1.2 : 1);

    let damage_clip_primary = damage_hit_primary * clip_size;
    let damage_clip_secondary = damage_hit_secondary * clip_size;

    let damage_second_1_primary = damage_clip_primary / seconds_clip;
    let damage_second_1_secondary = damage_clip_secondary / seconds_clip;

    let damage_second_2_primary = damage_clip_primary / (parseFloat(seconds_clip) + parseFloat(gun_data[7]));
    let damage_second_2_secondary = damage_clip_secondary / (parseFloat(seconds_clip) + parseFloat(gun_data[7]));


    // Damage unit scales
    let unit_dict = {
        "HP": 1,
        "Mallets": tool_dataset.getCellByString("Mallet", "Name", "Repair"),
        "Galleon A.": ship_dataset.getCellByString("Galleon", "Ship Type", "Armor"),
        "Pyramidion A.": ship_dataset.getCellByString("Pyramidion", "Ship Type", "Armor"),
        "Stormbreaker A.": ship_dataset.getCellByString("Stormbreaker", "Ship Type", "Armor"),
        "Galleon H.": ship_dataset.getCellByString("Galleon", "Ship Type", "Hull Health"),
        "Pyramidion H.": ship_dataset.getCellByString("Pyramidion", "Ship Type", "Hull Health"),
        "Stormbreaker H.": ship_dataset.getCellByString("Stormbreaker", "Ship Type", "Hull Health"),
        "B. Mallets": (tool_dataset.getCellByString("Mallet", "Name", "Repair") / 0.76),
        "Balloons": component_dataset.getCellByString("Balloon", "Name", "HP"),
        "Light Guns": component_dataset.getCellByString("Light Gun", "Name", "HP"),
        "Heavy Guns": component_dataset.getCellByString("Heavy Gun", "Name", "HP"),
        "Light Engines": component_dataset.getCellByString("Light Engine", "Name", "HP"),
        "Heavy Engines": component_dataset.getCellByString("Heavy Engine", "Name", "HP")
    };

    let armor_unit_scale = 1 / unit_dict[$("#armorUnitSelect").val()];
    let hull_unit_scale = 1 / unit_dict[$("#hullUnitSelect").val()];
    let balloon_unit_scale = 1 / unit_dict[$("#balloonUnitSelect").val()];
    let component_unit_scale = 1 / unit_dict[$("#componentUnitSelect").val()];

    // Calculate damages
    let damage_dict = {};

    // Damage / shot
    damage_dict["per shot"] = {};
    damage_dict["per shot"]["armor"] = armor_unit_scale * (damage_hit_primary * getDamageMod(damage_type_primary, "Armor") + damage_hit_secondary * getDamageMod(damage_type_secondary, "Armor"));
    damage_dict["per shot"]["hull"] = hull_unit_scale * (damage_hit_primary * getDamageMod(damage_type_primary, "Hull") + damage_hit_secondary * getDamageMod(damage_type_secondary, "Hull"));
    damage_dict["per shot"]["balloon"] = balloon_unit_scale * (damage_hit_primary * getDamageMod(damage_type_primary, "Balloon") + damage_hit_secondary * getDamageMod(damage_type_secondary, "Balloon"));
    damage_dict["per shot"]["component"] = component_unit_scale * (damage_hit_primary * getDamageMod(damage_type_primary, "Components") + damage_hit_secondary * getDamageMod(damage_type_secondary, "Components"));

    // Damage / clip
    damage_dict["per clip"] = {};
    damage_dict["per clip"]["armor"] = armor_unit_scale * (damage_clip_primary * getDamageMod(damage_type_primary, "Armor") + damage_clip_secondary * getDamageMod(damage_type_secondary, "Armor"));
    damage_dict["per clip"]["hull"] = hull_unit_scale * (damage_clip_primary * getDamageMod(damage_type_primary, "Hull") + damage_clip_secondary * getDamageMod(damage_type_secondary, "Hull"));
    damage_dict["per clip"]["balloon"] = balloon_unit_scale * (damage_clip_primary * getDamageMod(damage_type_primary, "Balloon") + damage_clip_secondary * getDamageMod(damage_type_secondary, "Balloon"));
    damage_dict["per clip"]["component"] = component_unit_scale * (damage_clip_primary * getDamageMod(damage_type_primary, "Components") + damage_clip_secondary * getDamageMod(damage_type_secondary, "Components"));

    // Damage / second (one clip)'
    damage_dict["per second"] = {};
    damage_dict["per second"]["armor"] = armor_unit_scale * (damage_second_1_primary * getDamageMod(damage_type_primary, "Armor") + damage_second_1_secondary * getDamageMod(damage_type_secondary, "Armor"));
    damage_dict["per second"]["hull"] = hull_unit_scale * (damage_second_1_primary * getDamageMod(damage_type_primary, "Hull") + damage_second_1_secondary * getDamageMod(damage_type_secondary, "Hull"));
    damage_dict["per second"]["balloon"] = balloon_unit_scale * (damage_second_1_primary * getDamageMod(damage_type_primary, "Balloon") + damage_second_1_secondary * getDamageMod(damage_type_secondary, "Balloon"));
    damage_dict["per second"]["component"] = component_unit_scale * (damage_second_1_primary * getDamageMod(damage_type_primary, "Components") + damage_second_1_secondary * getDamageMod(damage_type_secondary, "Components"));

    // Damage / second (with reloading)
    damage_dict["per second reload"] = {};
    damage_dict["per second reload"]["armor"] = armor_unit_scale * (damage_second_2_primary * getDamageMod(damage_type_primary, "Armor") + damage_second_2_secondary * getDamageMod(damage_type_secondary, "Armor"));
    damage_dict["per second reload"]["hull"] = hull_unit_scale * (damage_second_2_primary * getDamageMod(damage_type_primary, "Hull") + damage_second_2_secondary * getDamageMod(damage_type_secondary, "Hull"));
    damage_dict["per second reload"]["balloon"] = balloon_unit_scale * (damage_second_2_primary * getDamageMod(damage_type_primary, "Balloon") + damage_second_2_secondary * getDamageMod(damage_type_secondary, "Balloon"));
    damage_dict["per second reload"]["component"] = component_unit_scale * (damage_second_2_primary * getDamageMod(damage_type_primary, "Components") + damage_second_2_secondary * getDamageMod(damage_type_secondary, "Components"));

    // Fire / clip
    let fire_clip_base = parseFloat(gun_data[12] * ammo_data[11] * clip_size)
    let fire_clip_armor_primary = ammo_data[12] * damage_clip_primary * getDamageMod(damage_type_primary, "Armor");
    let fire_clip_armor_secondary = fire_clip_base + ammo_data[12] * damage_clip_secondary * getDamageMod(damage_type_secondary, "Armor");
    let fire_clip_balloon_primary = ammo_data[12] * damage_clip_primary * getDamageMod(damage_type_primary, "Balloon");
    let fire_clip_balloon_secondary = fire_clip_base + ammo_data[12] * damage_clip_secondary * getDamageMod(damage_type_secondary, "Balloon");
    let fire_clip_component_primary = ammo_data[12] * damage_clip_primary * getDamageMod(damage_type_primary, "Components");
    let fire_clip_component_secondary = fire_clip_base + ammo_data[12] * damage_clip_secondary * getDamageMod(damage_type_secondary, "Components");
    damage_dict["fire"] = {};
    damage_dict["fire"]["armor"] = fire_clip_armor_primary + fire_clip_armor_secondary;
    damage_dict["fire"]["hull"] = 0;
    damage_dict["fire"]["balloon"] = fire_clip_balloon_primary + fire_clip_balloon_secondary;
    damage_dict["fire"]["component"] = fire_clip_component_primary + fire_clip_component_secondary;

    return {"damage": damage_dict, "info": info_dict};
}

function updateGunInfoTable() {
    if (!(gun_dataset && ammo_dataset && damage_dataset && tool_dataset && component_dataset && ship_dataset)) {
        console.log("Damage calculator still loading");
        setTimeout(function(){ updateGunInfoTable(); }, 1000);
        return;
    }

    let gun_numbers = getGunNumbers();
    // Fill out UI

    let gunTableContents = $(`
        <tr>
          <td>` + precise(gun_numbers.info["range"], 3) + `</td>
          <td>` + precise(gun_numbers.info["arming distance"], 3) + `</td>
          <td>` + precise(gun_numbers.info["seconds per clip"], 2) + `</td>
          <td>` + gun_numbers.info["clip size"] + `</td>
          <td>` + precise(gun_numbers.info["aoe"], 3) + `</td>
        </tr>`);
    $("#gunContent").empty();
    $("#gunContent").append(gunTableContents);

    let damageTableContents = $(`
        <tr>
          <th>Damage / shot</th>
          <td>` + precise(gun_numbers.damage["per shot"]["armor"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per shot"]["hull"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per shot"]["balloon"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per shot"]["component"], 3) + `</td>
        </tr>
        <tr>
          <th>Damage / second (one clip)</th>
          <td>` + precise(gun_numbers.damage["per second"]["armor"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per second"]["hull"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per second"]["balloon"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per second"]["component"], 3) + `</td>
        </tr>
        <tr>
          <th>Damage / second (with reloading)</th>
          <td>` + precise(gun_numbers.damage["per second reload"]["armor"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per second reload"]["hull"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per second reload"]["balloon"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per second reload"]["component"], 3) + `</td>
        </tr>
        <tr>
          <th>Damage / clip</th>
          <td>` + precise(gun_numbers.damage["per clip"]["armor"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per clip"]["hull"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per clip"]["balloon"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["per clip"]["component"], 3) + `</td>
        </tr>
        <tr>
          <th>Fire / clip (avg.)</th>
          <td>` + precise(gun_numbers.damage["fire"]["armor"], 3) + `</td>
          <td>` + "-" + `</td>
          <td>` + precise(gun_numbers.damage["fire"]["armor"], 3) + `</td>
          <td>` + precise(gun_numbers.damage["fire"]["component"], 3) + `</td>
        </tr>
    `);
    $("#damageTableContent").empty();
    $("#damageTableContent").append(damageTableContents);

}