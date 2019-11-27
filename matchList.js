
function initializeMatchList(){
    // Events
    $("#matchFilterSelect,#matchFilterModeSelect").on("change", matchFilterSubmitted);
    $("#matchFilterText").on("input keydown keyup mousedown mouseup select contextmenu drop", matchFilterSubmitted);
    
    setMatchTableItems(match_dataset.getDatasetRows());
    matchFilterSubmitted();
}


function matchFilterSubmitted() {
  let filterType = $("#matchFilterSelect").val();
  let filterMode = $("#matchFilterModeSelect").val() == "Exclude";
  let filterText = $("#matchFilterText").val();
  let dataset = null;
  if (filterType == "All" && !filterMode)
    dataset = match_dataset;
  else if (filterType == "All" && filterMode)
    dataset = match_dataset.getEmptyContent();
  else if (filterType == "Date after (DDMMYYYY)")
    dataset = match_dataset.filterByDate(filterText, "Date of match", filterMode, true);
  else if (filterType == "Date before (DDMMYYYY)")
    dataset = match_dataset.filterByDate(filterText, "Date of match", filterMode, false);
  else if (filterType == "Ship")
    dataset = match_dataset.filterByStringMultiCol(filterText, ["T1 Ship 1", "T1 Ship 2", "T2 Ship 1", "T2 Ship 2"], filterMode, false);
  else if (filterType == "Pilot")
    dataset = match_dataset.filterByStringMultiCol(filterText, ["T1S1 Pilot", "T1S2 Pilot", "T2S1 Pilot", "T2S2 Pilot"], filterMode, false);
  else
    dataset = match_dataset.filterByString(filterText, filterType, filterMode, false);

  setMatchTableItems(dataset.getDatasetRows());
}

function setMatchTableItems(rows) {
  $("#matchTable").empty();
  let table_title = $(`
            <tr>
              <th>Date</th>
              <th>Event</th>
              <th>Result</th>
              <th>T1 Ships</th>
              <th>T2 Ships</th>
              <th>T1 Pilots</th>
              <th>T2 Pilots</th>
            </tr>`);
  $("#matchTable").append(table_title);

  for (let i = 0; i < rows.length; i++) {
    let row = rows[i]
    let match_table_row = $(`
            <tr>
              <td>` + row[1] + `</td>
              <td>` + row[2] + `</td>
              <td>` + row[3] + ":" + row[4] + `</td>
              <td>` + row[5] + "<br>" + row[6] + `</td>
              <td>` + row[7] + "<br>" + row[8] + `</td>
              <td>` + row[9] + "<br>" + row[10] + `</td>
              <td>` + row[11] + "<br>" + row[12] + `</td>
            </tr>`);
    $("#matchTable").append(match_table_row);
  }
}

function setShipTableItems(rows) {
  // let rows = sheet.getDbRowsByString("Stormbreaker", "Ship");
  $("#shipsTable").empty();
  let table_title = $(`
        <tr>
          <th>Ship</th>
          <th>Name</th>
          <th>Gun loadout</th>
          <th>Crew loadouts</th>
          <th>Crew positions</th>
          <th>Strategy</th>
          <th>Strong VS</th>
          <th>Weak VS</th>
        </tr>`);
  $("#shipsTable").append(table_title);

  for (let i = 0; i < rows.length; i++) {
    let row = rows[i]
    let ship_table_div = $(`
        <tr>
          <td rowspan="4">` + row[0] + `</td>
          <td rowspan="4">` + row[1] + `</td>
          <td rowspan="4">` + row[2].replace(/,/gi, "<br>") + `</td>
          <td>` + row[3] + `</td>
          <td>` + row[7] + `</td>
          <td rowspan="4">` + row[11] + `</td>
          <td rowspan="4">` + row[12].replace(/,/gi, "<br>") + `</td>
          <td rowspan="4">` + row[13].replace(/,/gi, "<br>") + `</td>
        </tr>
        <tr>
          <td>` + row[4] + `</td>
          <td>` + row[8] + `</td>
        </tr>
        <tr>
          <td>` + row[5] + `</td>
          <td>` + row[9] + `</td>
        </tr>
        <tr>
          <td>` + row[6] + `</td>
          <td>` + row[10] + `</td>
        </tr>`);

    // $("#shipsTable").append(ship_table_div);
    $("#shipsTable").append(ship_table_div);
  }

}