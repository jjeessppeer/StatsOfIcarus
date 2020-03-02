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
          logIn(res[0], res[1])
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
          logIn(res[0], res[1])
        }
        $("#registerButton").prop('disabled', false);
      });
  });

  $("#logoutButton").on("click", function () {
    logOut();
  });
}

function logIn(token, name){
  console.log("Logging in: ", name, ", ", token);
  login_token = token;
  $("#loginModal").modal('hide');
  $("#loginModalButton").hide();
  $("#logoutSidebar").show();
  $("#loginName").text("Logged in as: " + name);
  $("#loginUsername").val("");
  $("#loginPassword").val("");
  loginWarning("");
}

function logOut(){
  console.log("Logging out");
  $("#loginModalButton").show();
  $("#logoutSidebar").hide();
  login_token = "";
  $("#loginUsername").val("");
  $("#loginPassword").val("");
  loginWarning("");
}

function loginWarning(text){
  $("#loginWarningText").text(text);
}

