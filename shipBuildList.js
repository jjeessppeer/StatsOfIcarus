



function initializeBuildList(){
    $("#buildSubmitButton").on("click", submitBuild);
    $("#buildFilterSubmit").on("click", () => requestBuilds());


    
    $("#buildFilterShip,#buildFilterPvE,#buildFilterAuthor,#buildFilterOrder").on("change", () => requestBuilds());
    $("#buildFilterName").on("input", () => requestBuilds());

    $("#buildPageNavPrev").on("click", () => {
      current_build_page-=1;
      updatePageNav();
      requestBuilds();
    });
    $("#buildPageNavNext").on("click", () => {
      current_build_page+=1;
      updatePageNav();
      requestBuilds();
    });
    $("#buildPageNavFirst").on("click", () => {
      current_build_page=1;
      updatePageNav();
      requestBuilds();
    });
    $("#buildPageNavLast").on("click", () => {
      current_build_page=n_build_pages;
      updatePageNav();
      requestBuilds();
    });


    requestBuilds();
}


function requestBuildRemoval(build_id){
  console.log("Delete build: ", build_id);
  httpxPostRequest(server_adress+"/remove_build", [build_id], 
    function(){
      if (this.readyState == 4 && this.status == 200){
        // $("#build-"+build_id+"").remove();
        requestBuilds();
      }
    }, 
    function(){
      let btn = $("#build-"+build_id+" .btn:nth-of-type(4)")
      btn.text("Delete failed");
      btn.prop('disabled', false);
    });
}

function requestBuilds(flash_top=false){
  $(".ship-build-table-item").remove();
  
  let start = (current_build_page-1)*8 + 1;
  let end = start+7;

  let name_filter = $("#buildFilterName").val();
  let ship_filter = $("#buildFilterShip").val();
  let pve_filter = $("#buildFilterPvE").val();
  let submitter_filter = $("#buildFilterAuthor").val();
  let sorting = $("#buildFilterOrder").val();

  httpxPostRequest(server_adress+"/request_build", [start, end, name_filter, ship_filter, pve_filter, submitter_filter, sorting], function(){
    if (this.readyState == 4 && this.status == 200){
      let json = JSON.parse(this.response);
      let builds = json[0];
      let n_builds = json[1];

      n_build_pages = Math.max(1, Math.ceil(n_builds/8));
      updatePageNav();
      for (i=0; i<builds.length; i++){
        let build_id = sanitizeHtml(builds[i].build_id);
        let upvotes = sanitizeHtml(builds[i].upvotes);
        let description = sanitizeHtml(builds[i].description);
        let build_code = sanitizeHtml(builds[i].build_code);
        let voted = sanitizeHtml(builds[i].voted) == "true";
        let mine = sanitizeHtml(builds[i].mine) == "true";
        let public = sanitizeHtml(builds[i].public) == "true";
        let flash = i==0 && flash_top;

        addToBuildTable(build_id, upvotes, 0, description, build_code, voted, mine, public, i+1, flash);
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

  httpxPostRequest(server_adress+"/submit_build", [build_code, description], 
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

        current_build_page = 1;

        requestBuilds(true);

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


function toggleUpvote(){
  let id = $(this).data("id");
  let enable = !$(this).hasClass("voted");

  console.log("voting: ", id, ", ", enable);
  httpxPostRequest(server_adress+"/upvote_build", [id, enable], function(){
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
  httpxPostRequest(server_adress+"/publicice_build", [build_id, make_public], function(){
    if (this.readyState == 4 && this.status == 200){
      let res = JSON.parse(this.response);
      let made_public = Boolean(res[0]);
      let build_id = parseInt(res[1]);

      let table_row = $("#build-"+build_id);
      let pub_btn = table_row.find(".btn:nth-of-type(2)");
      let priv_btn = table_row.find(".btn:nth-of-type(3)");

      pub_btn.prop('disabled', false);
      priv_btn.prop('disabled', false);
      pub_btn.toggle(!made_public);
      priv_btn.toggle(made_public);
    }
  });
}

var current_build_page = 1;
var n_build_pages = 1;
function updatePageNav(){
  current_build_page = Math.min(n_build_pages, current_build_page);
  current_build_page = Math.max(1, current_build_page);
  $("#buildPageNavCurr > a").text(current_build_page);
  $("#buildPageNavLast > a").text(n_build_pages);
  $("#buildPageNavFirst").toggle(current_build_page != 1);
  $("#buildPageNavLast").toggle(current_build_page != n_build_pages);
}

function addToBuildTable(id, upvotes, downvotes, description, build_code, voted, mine, public, index, flash=false){
  let build_data = parseBuildCode(build_code);
  // console.log(build_data)
  
  let n_guns = parseInt(ship_guns_dataset.getCellByString(build_data.ship, "Ship", "N guns"));
  let table_obj = $(`
    <tbody class="ship-build-table-item" id="build-`+id+`">
    <tr>
      <td rowspan="2"><p>`+index+`</p></td>
      <td rowspan="2">
        <div class="upvote`+(voted ? " voted" : "")+`" data-id="`+id+`" data-votes="`+upvotes+`"><i class="fas fa-chevron-up"></i></div>
      <td rowspan="2"><a class="build-name" href="#shipBuilder?`+build_code+`">`+build_data.name+`</a></td>
      <td colspan="2">`+build_data.ship+`</td>
      <td rowspan="2">`+description+`</td>
      <td rowspan="2" style="border-left: 1px solid rgb(222, 226, 230); margin:0; padding:0;">
      <button class="btn btn-info tablebtn copybtn" type="button">Copy&nbsplink</button>
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
  if (flash){
    table_obj.addClass("blink-div");
    setTimeout(function() {
      if (table_obj) table_obj.removeClass("blink-div")}, 4500);
  }
  $("#buildDatabaseTable").append(table_obj);
  

  let copy_btn = table_obj.find(".btn:nth-of-type(1)");
  let public_btn = table_obj.find(".btn:nth-of-type(2)");
  let private_btn = table_obj.find(".btn:nth-of-type(3)");
  let del_btn = table_obj.find(".btn:nth-of-type(4)");
  if (!mine) {
    del_btn.hide();
    private_btn.hide();
    public_btn.hide();
  }
  copy_btn.on("click", function(){
    let build_id = $(this).parent().parent().find(".upvote").data("id");
    let name = $(this).parent().parent().find(".build-name").text();
    let link = window.location.href.split("#")[0] + "#shipBuilder" + "?id=" + build_id + "&name=" + encodeURIComponent(name);
    copyToClipboard(link);
    $(".copybtn").text("Copy link")
    $(this).text("Link copied")
  });
  del_btn.on("click", function(){
    let build_id = $(this).parent().parent().find(".upvote").data("id");
    $(this).text("Deleteing...");
    $(this).prop('disabled', true);
    requestBuildRemoval(build_id);
  });
  public_btn.on("click", function(){
    let build_id = $(this).parent().parent().find(".upvote").data("id");
    $(this).prop('disabled', true);
    makeBuildPublic(build_id, true);
  });
  private_btn.on("click", function(){
    let build_id = $(this).parent().parent().find(".upvote").data("id");
    $(this).prop('disabled', true);
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