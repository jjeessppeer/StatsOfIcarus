



function initializeBuildList(){
    addToBuildTable(5, 0, "A Metajunker that gets a more forward trifecta than the traditional one, which I would have loved to see used more often", "IwGmoJhAGEA4aNsxA2JiDMICsZEAs8uI6K2eosRCeZWJVINJ9sF+1xdIA6gK4A7ACYBnAIYAbAF4ByUQAIAsgFMALuIBSQgNYqATkA");
    addToBuildTable(5, 0, "A Metajunker that gets a more forward trifecta than the traditional one, which I would have loved to see used more often", "IwGmoJhAGEA4aNsxA2JiDMICsZEAs8uI6K2eosRCeZWJVINJ9sF+1xdIA6gK4A7ACYBnAIYAbAF4ByUQAIAsgFMALuIBSQgNYqATkA");
    addToBuildTable(5, 0, "A Metajunker that gets a more forward trifecta than the traditional one, which I would have loved to see used more often", "IwGmoJhAGEA4aNsxA2JiDMICsZEAs8uI6K2eosRCeZWJVINJ9sF+1xdIA6gK4A7ACYBnAIYAbAF4ByUQAIAsgFMALuIBSQgNYqATkA");
    addToBuildTable(1, 4, "i think this will be good for crewcible.", "IwJgNMAsbgHDYAMYC0wIYKxm855kBmHMY8adbANg2WnGLpOtKVe3SfhcfdfOZgaACQCmAQwBOAFwBCkiQGtRkoA");
}



function addToBuildTable(upvotest, downvotes, description, build_code){
  let build_data = parseBuildCode(build_code);
  console.log(build_data)
  let table_obj = $(`
    <tr>
      <td rowspan="2"><i class="fas fa-chevron-up"></i>`+upvotest+`<br><i class="fas fa-chevron-down"></i>-`+downvotes+`</td>
      <td rowspan="2"><a href="#shipBuilder?`+build_code+`">`+build_data.name+`</a></td>
      <td colspan="2">`+build_data.ship+`</td>
      <td rowspan="2">`+description+`</td>
    </tr>
    <tr>
      <td style="white-space:nowrap;">1: `+build_data.guns[0]+`<br>2: `+build_data.guns[1]+`<br>3: `+build_data.guns[2]+`</td>
      <td style="white-space:nowrap;">4: `+build_data.guns[3]+`<br>5: `+build_data.guns[4]+`<br>6: `+build_data.guns[5]+`</td>
    </tr>`);
  $("#buildDatabaseTable").append(table_obj);
  table_obj.find("a").on("click", function(){
    console.log( $(this).attr('href'));
    openPageFromUrl.call(this);
    shipBuilderImport(null, getUrlParam(window.location.href));
  });

}