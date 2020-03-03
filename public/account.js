function initializeAccount() {
  $("#loginButton").on("click", function () {
    let username = $("#loginUsername").val();
    let password = $("#loginPassword").val();
    $("#loginButton").prop('disabled', true);
    httpxPostRequest("/login", [username, password],
      function () {
        if (this.response == -2) loginWarning("Wrong username/password.");
        else if (this.response == -1) loginWarning("Too many failed logins.");
        else {
          let res = JSON.parse(this.response);
          logIn(res[0], res[1], res[2]);
          requestBuilds();
        }
        $("#loginButton").prop('disabled', false);

      });
  });

  $("#registerButton").on("click", function () {
    let username = $("#loginUsername").val();
    let password = $("#loginPassword").val();
    $("#registerButton").prop('disabled', true);
    httpxPostRequest("/register", [username, password], function () {
      if (this.status == 200) {
        // $("#loginWarningText").css('color', 'green');
        // $("#loginWarningText").text("Account registered!");
        let res = JSON.parse(this.response);
        logIn(res[0], res[1], res[2]);
        requestBuilds();
      }
      else if (this.status == 400) $("#loginWarningText").text(this.response);
      $("#registerButton").prop('disabled', false);
    });
  });

  $("#logoutButton").on("click", function () {
    logOut();
    requestBuilds();
  });

  $("#mergeProfileButton").on("click", function () {
    httpxPostRequest("/merge", [login_token], function () {
      let res = JSON.parse(this.response);
      console.log(res);
      checkIn();
    });
  });


  $("#changeUsernameButton").on("click", () => changeProfile("set_username", $("#changeUsernameText").val()));
  $("#changeDisplayNameButton").on("click", () => changeProfile("set_name", $("#changeDisplayNameText").val()));
  $("#changePasswordButton").on("click", () => changeProfile("set_password", $("#changePasswordText").val()));


}

function logIn(token, name, ip_name){
  login_token = token;
  $("#loginModal").modal('hide');
  $("#loginModalButton").hide();
  $("#logoutSidebar").show();
  $("#loginName").text("Logged in as: " + name);
  $("#loginUsername").val("");
  $("#loginPassword").val("");
  console.log(ip_name)
  $("#profileIpName").text(ip_name);
  $("#profileAccName").text(name);
  loginWarning("");
  if ($("#keepLoginCheck").is(":checked")) setCookie("login_token", token);
}

function logOut(){
  $("#loginModalButton").show();
  $("#logoutSidebar").hide();
  login_token = "";
  $("#loginUsername").val("");
  $("#loginPassword").val("");
  loginWarning("");
  setCookie("login_token", "");
  document.cookie = "login_token"+"="+"a";
}

function checkToken() {
  httpxPostRequest("/check_in", [login_token],
    function() {
      let res = JSON.parse(this.response);
      if (this.response == 0) logOut();
      else logIn(res[0], res[1], res[2]);
      loadDatasetsFromServer();
      initializeAccount();
  });
}

function checkIn() {
  httpxPostRequest("/check_in", [login_token],
    function() {
      let res = JSON.parse(this.response);
      if (this.response == 0) logOut();
      else logIn(res[0], res[1], res[2]);
      requestBuilds();
  });
}

function loginWarning(text){
  $("#loginWarningText").text(text);
}

function changeProfile(action, data){
  httpxPostRequest("/change_profile", [login_token, action, data],
    function() {
      console.log("RES: ", this.status, ", ", this.response);
      if (this.status == 200) $("#profileChangeText").css('color', 'green');
      else $("#profileChangeText").css('color', 'red');
      $("#profileChangeText").text(this.response);
      console.log("PROFILE CHANGED ", this.response);
  });
}
