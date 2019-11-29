



function initializeBuildList(){
    addToBuildTable(0, 5, 0, "A Metajunker that gets a more forward trifecta than the traditional one, which I would have loved to see used more often", "IwGmoJhAGEA4aNsxA2JiDMICsZEAs8uI6K2eosRCeZWJVINJ9sF+1xdIA6gK4A7ACYBnAIYAbAF4ByUQAIAsgFMALuIBSQgNYqATkA");
    addToBuildTable(0, 5, 0, "", "IwGmoJhAGEA4aNsxA2JiDMICsZEAs8uI6K2eosRCeZWJVINJ9sF+1xdIA6gK4A7ACYBnAIYAbAF4ByUQAIAsgFMALuIBSQgNYqATkA");
    addToBuildTable(0, 5, 0, "Drift is cool", "CwGgjArCBM4yAGEBaM8AcIpSUtYkBmeWJUbEANnjWKjTPimOKKzkcymtZDo5Dl21ACIBLgFYADgAQA3AK5A");
    addToBuildTable(0, 1, 4, "i think this will be good for crewcible.", "IwJgNMAsbgHDYAMYC0wIYKxm855kBmHMY8adbANg2WnGLpOtKVe3SfhcfdfOZgaACQCmAQwBOAFwBCkiQGtRkoA");

    $("#buildSubmitButton").on("click", submitBuild);
    $("#requestBuildButton").on("click", requestBuild);
    getNBuilds();
}

function requestBuild(){
  console.log("Requesting build");
  let [start, end] = $("#requestBuildText").val().split(",");
  console.log([start, end])
  httpxPostRequest("http://79.136.70.98:3231/request_build", [start, end], function(){
    console.log("Request status ", this.readyState, ", ", this.status);
    console.log(this.response);
    if (this.readyState == 4 && this.status == 200){
      let json = JSON.parse(this.response);
      console.log(json)
      for (i=0; i<json.length; i++){
        let build_id = sanitizeHtml(json[i].build_id);
        let upvotes = sanitizeHtml(json[i].upvotes);
        let description = sanitizeHtml(json[i].description);
        let build_code = sanitizeHtml(json[i].build_code);
        let voted = sanitizeHtml(json[i].voted) == "true";
        addToBuildTable(build_id, upvotes, 0, description, build_code, voted);
      }
    }
  });
}

function submitBuild(){
  console.log("Submitting build");
  let name = $("#shipBuildName").val();
  let build_code = shipBuilderGetExportCode(false);
  console.log(build_code);
  let description = $("#buildDescriptionArea").val();

  httpxPostRequest("http://79.136.70.98:3231/submit_build", [name, build_code, description], function(){
    console.log("Request status ", this.readyState, ", ", this.status);
    console.log(this.response);
  });
}

function getNBuilds(){
  httpxGetRequest("http://79.136.70.98:3231/n_pages", function(){
    console.log("Request status ", this.readyState, ", ", this.status);
    if (this.readyState == 4 && this.status == 200){
      console.log("NBUILDS: ", this.response);
    }
  });
}

function toggleUpvote(){
  let id = $(this).data("id");
  let enable = !$(this).hasClass("voted");

  console.log("voting: ", id, ", ", enable);
  httpxPostRequest("http://79.136.70.98:3231/upvote_build", [id, enable], function(){
    console.log("Request status ", this.readyState, ", ", this.status);
    if (this.readyState == 4 && this.status == 200){
      let res = JSON.parse(this.response);
      let div = $("[data-id='"+res.id+"']")
      console.log(div.data("votes"));
      if (res.voted){
        div.addClass("voted");
        // $(div).attr('data-votes','hello');
        $(div).attr('data-votes', parseInt($(div).attr('data-votes')) + 1);
        // div.data("votes", 2123);
      }
      else{
        div.removeClass("voted");
        $(div).attr('data-votes', parseInt($(div).attr('data-votes')) - 1);
        // div.data("votes", 2);
      }
       
    }
  });
}


function addToBuildTable(id, upvotes, downvotes, description, build_code, voted=false){
  console.log("adding to table");
  let build_data = parseBuildCode(build_code);
  // console.log(build_data)
  
  // <div class="downvote" data-id="`+id+`" style="display:none"><i class="fas fa-chevron-down"></i>-`+downvotes+`</div></td>
  let table_obj = $(`
    <tr>
      <td rowspan="2">
        <div class="upvote`+(voted ? " voted" : "")+`" data-id="`+id+`" data-votes="`+upvotes+`"><i class="fas fa-chevron-up"></i></div>
      <td rowspan="2"><a class="build-name" href="#shipBuilder?`+build_code+`">`+build_data.name+`</a></td>
      <td colspan="2">`+build_data.ship+`</td>
      <td rowspan="2">`+description+`</td>
    </tr>
    <tr>
      <td style="white-space:nowrap;">1: `+build_data.guns[0]+`<br>2: `+build_data.guns[1]+`<br>3: `+build_data.guns[2]+`</td>
      <td style="white-space:nowrap;">4: `+build_data.guns[3]+`<br>5: `+build_data.guns[4]+`<br>6: `+build_data.guns[5]+`</td>
    </tr>`);
  $("#buildDatabaseTable").append(table_obj);
  
  table_obj.find("a").on("click", function(){
    // console.log( $(this).attr('href'));
    openPageFromUrl.call(this);
    shipBuilderImport(null, getUrlParam(window.location.href));
    if (description!="") $("#buildDescriptionCol").show();
    else $("#buildDescriptionCol").hide();
    
    $("#shipBuilderDesCheck").prop('checked', description!="");
    $("#buildDescriptionArea").val(description);
  });
  table_obj.find(".upvote").on("click", toggleUpvote);

}