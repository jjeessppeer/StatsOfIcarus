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
          logIn(res[0], res[1]);
          requestBuilds();
        }
        $("#loginButton").prop('disabled', false);

      });
  });

  $("#registerButton").on("click", function () {
    let username = $("#loginUsername").val();
    let password = $("#loginPassword").val();
    $("#registerButton").prop('disabled', true);
    httpxPostRequest("/register", [username, password],
      function () {
        if (this.response == -2) loginWarning("No special characters allowed.");
        else if (this.response == -1) loginWarning("Username already registered.");
        else {
          let res = JSON.parse(this.response);
          logIn(res[0], res[1]);
          requestBuilds();
        }
        $("#registerButton").prop('disabled', false);
      });
  });

  $("#logoutButton").on("click", function () {
    logOut();
    requestBuilds();
  });
}

function logIn(token, name){
  login_token = token;
  $("#loginModal").modal('hide');
  $("#loginModalButton").hide();
  $("#logoutSidebar").show();
  $("#loginName").text("Logged in as: " + name);
  $("#loginUsername").val("");
  $("#loginPassword").val("");
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

function loginWarning(text){
  $("#loginWarningText").text(text);
}

