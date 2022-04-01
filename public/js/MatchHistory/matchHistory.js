

function initializeMatchHistory(){

    let overview = document.createElement('li', {is: 'match-history-entry'});

    document.getElementById("matchHistoryList").append(overview);  
    requestMatchListUpdate(); 
}

function requestMatchListUpdate(){
    console.log("Requesting match history update");
    httpxPostRequest('/get_match_history2', {}, function() {
        if (this.readyState == 4 && this.status == 200){
            let response = JSON.parse(this.response);
            updateMatchHistoryList(response); 
        }
    });
}

function updateMatchHistoryList(matchHistory){
    console.log("Match history recieved");
    console.log(matchHistory);

    // Clear old table.
    document.getElementById("matchHistoryList").innerHTML = "";


    // Insert new match history elements from the input list.
    for (let entry in matchHistory.data) {
        
    }
    
}