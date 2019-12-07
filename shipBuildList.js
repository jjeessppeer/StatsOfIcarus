



function initializeBuildList(){
    $("#buildSubmitButton").on("click", submitBuild);
    $("#buildFilterSubmit").on("click", () => (requestBuilds()));
    requestBuilds();
}


function requestBuildRemoval(build_id){
  console.log("Delete build: ", build_id);
  httpxPostRequest("http://79.136.70.98:3231/remove_build", [build_id], 
    function(){
      if (this.readyState == 4 && this.status == 200){
        $("#build-"+build_id+"").remove();
      }
    }, 
    function(){
      let btn = $("#build-"+build_id+" .btn:nth-of-type(3)")
      btn.text("Delete failed");
      btn.prop('disabled', false);
    });
}

function requestBuilds(start=1, end=8){
  // $("#buildDatabaseTable").remove(".ship-build-table-item");
  $(".ship-build-table-item").remove();
  console.log("Requesting build");

  // let [start, end] = $("#requestBuildText").val().split(",");
  console.log([start, end])

  let name_filter = $("#buildFilterName").val();
  let ship_filter = $("#buildFilterShip").val();
  let pve_filter = $("#buildFilterPvE").val();
  let submitter_filter = $("#buildFilterAuthor").val();
  let sorting = $("#buildFilterOrder").val();

  // http://79.136.70.98:3231/request_build
  // http://localhost:3231/request_build
  // http://192.168.1.1:3231/request_build
  httpxPostRequest("http://79.136.70.98:3231/request_build", [start, end, name_filter, ship_filter, pve_filter, submitter_filter, sorting], function(){
    if (this.readyState == 4 && this.status == 200){
      let json = JSON.parse(this.response);
      console.log("Builds recieved")
      console.log(json)
      for (i=0; i<json.length; i++){
        let build_id = sanitizeHtml(json[i].build_id);
        let upvotes = sanitizeHtml(json[i].upvotes);
        let description = sanitizeHtml(json[i].description);
        let build_code = sanitizeHtml(json[i].build_code);
        let voted = sanitizeHtml(json[i].voted) == "true";
        let mine = sanitizeHtml(json[i].mine) == "true";
        let public = sanitizeHtml(json[i].public) == "true";

        addToBuildTable(build_id, upvotes, 0, description, build_code, voted, mine, public);
      }
    }
  });
}

function submitBuild(){
  console.log("Submitting build");
  let btn = $(this);

  btn.attr("disabled", true);
  btn.text("Submitting...");
  
  let build_code = shipBuilderGetExportCode(false);
  let description = $("#buildDescriptionArea").val();

  httpxPostRequest("http://79.136.70.98:3231/submit_build", [build_code, description], 
    function(){
      if (this.readyState == 4 && this.status == 200){
        let btn = $("#buildSubmitButton");
        btn.attr("disabled", false);
        btn.text("Submit to database");
        $("#buildFilterPvE").val("Include");
        $("#buildFilterAuthor").val("Me");
        $("#buildFilterOrder").val("Date (new)");

        $("[data-show='#buildDatabase'] > a").trigger("click");
        window.location.hash = "buildDatabase";
        requestBuilds();

      }
      else if (this.readyState == 4 && this.status == 400){
        let btn = $("#buildSubmitButton");
        btn.attr("disabled", false);
        btn.text("Submission rejected");
      }
    },
    function(){
      let btn = $("#buildSubmitButton");
      btn.attr("disabled", false);
      btn.text("Submission failed");
    });
}

// function refreshBuilds(){
//   httpxGetRequest("http://79.136.70.98:3231/n_pages", function(){
//     console.log("Request status ", this.readyState, ", ", this.status);
//     if (this.readyState == 4 && this.status == 200){
//       console.log("NBUILDS: ", this.response);
//       // requestBuilds(1, parseInt(this.response));
//     }
//   });
// }

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
      }
    }
  });
}

function makeBuildPublic(build_id, make_public){
  httpxPostRequest("http://79.136.70.98:3231/publicice_build", [build_id, make_public], function(){
    if (this.readyState == 4 && this.status == 200){
      let res = JSON.parse(this.response);
      let made_public = Boolean(res[0]);
      let build_id = parseInt(res[1]);

      let table_row = $("#build-"+build_id);
      let pub_btn = table_row.find(".btn:nth-of-type(1)");
      let priv_btn = table_row.find(".btn:nth-of-type(2)");

      pub_btn.toggle(!made_public);
      priv_btn.toggle(made_public);
    }
  });
}

function addToBuildTable(id, upvotes, downvotes, description, build_code, voted, mine, public){
  let build_data = parseBuildCode(build_code);
  // console.log(build_data)
  
  let n_guns = parseInt(ship_guns_dataset.getCellByString(build_data.ship, "Ship", "N guns"));
  let table_obj = $(`
    <tbody class="ship-build-table-item" id="build-`+id+`">
    <tr>
      <td rowspan="2">
        <div class="upvote`+(voted ? " voted" : "")+`" data-id="`+id+`" data-votes="`+upvotes+`"><i class="fas fa-chevron-up"></i></div>
      <td rowspan="2"><a class="build-name" href="#shipBuilder?`+build_code+`">`+build_data.name+`</a></td>
      <td colspan="2">`+build_data.ship+`</td>
      <td rowspan="2">`+description+`</td>
      <td rowspan="2" style="border-left: 1px solid rgb(222, 226, 230); margin:0; padding:0;">
        <button class="btn btn-info tablebtn" type="button" style="display:`+(public&&mine ? "none" : "block")+`">Make&nbsppublic</button>
        <button class="btn btn-secondary tablebtn" type="button" style="display:`+(!public&&mine ? "none" : "block")+`">Make&nbspprivate</button>
        <button class="btn btn-danger tablebtn" type="button">Delete</button>
      </td>
    </tr>
    <tr>
      <td style="width:100px">
        `+(n_guns>=1 ? "1:&nbsp;"+build_data.guns[0]+"<br>" : "")+`
        `+(n_guns>=2 ? "2:&nbsp;"+build_data.guns[1]+"<br>" : "")+`
        `+(n_guns>=3 ? "3:&nbsp;"+build_data.guns[2]+"<br>" : "")+`
      </td>
      <td style="width:100px">
        `+(n_guns>=4 ? "4:&nbsp;"+build_data.guns[3]+"<br>" : "")+`
        `+(n_guns>=5 ? "5:&nbsp;"+build_data.guns[4]+"<br>" : "")+`
        `+(n_guns>=6 ? "6:&nbsp;"+build_data.guns[5]+"<br>" : "")+`
      </td>
    </tr>
    </tbody>`);
  $("#buildDatabaseTable").append(table_obj);
  

  let del_btn = table_obj.find(".btn:nth-of-type(3)");
  let public_btn = table_obj.find(".btn:nth-of-type(1)");
  let private_btn = table_obj.find(".btn:nth-of-type(2)");
  if (!mine) del_btn.hide();
  del_btn.on("click", function(){
    let build_id = $(this).parent().parent().find(".upvote").data("id");
    $(this).text("Deleteing...");
    $(this).prop('disabled', true);

    requestBuildRemoval(build_id);
  });
  public_btn.on("click", function(){
    let build_id = $(this).parent().parent().find(".upvote").data("id");
    makeBuildPublic(build_id, true);
  });
  private_btn.on("click", function(){
    let build_id = $(this).parent().parent().find(".upvote").data("id");
    makeBuildPublic(build_id, false);
  });

  table_obj.find("a").on("click", function(){
    // console.log( $(this).attr('href'));
    openPageFromUrl.call(this);
    shipBuilderImport(null, getUrlParam($(this).attr('href')));
    if (description!="") $("#buildDescriptionCol").show();
    else $("#buildDescriptionCol").hide();
    
    $("#shipBuilderDesCheck").prop('checked', description!="");
    $("#buildDescriptionArea").val(description);
  });
  table_obj.find(".upvote").on("click", toggleUpvote);

}