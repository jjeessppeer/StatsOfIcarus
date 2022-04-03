

function initializeMatchHistory(){

    let overview = document.createElement('li', {is: 'match-history-entry'});

    document.getElementById("matchHistoryList").append(overview);  
    requestMatchListUpdate(); 
}

function requestMatchListUpdate(){
    console.log("Requesting match history update");

    // Clear old table.
    document.getElementById("matchHistoryList").innerHTML = "";

    // Parse filters
    // TODO
    let filters = [];
    let offset = 0;
    let count = 10;

    let requestData = {filters: filters, offset: offset, count: count};

    // Request new data
    httpxPostRequest('/get_match_history2', requestData, function() {
        if (this.readyState == 4 && this.status == 200){
            let response = JSON.parse(this.response);
            updateMatchHistoryList(response); 
        }
    });
}

function updateMatchHistoryList(matchHistory){
    console.log("Match history recieved");
    console.log(matchHistory);

    // Insert new match history elements from the input list.
    for (let entry of matchHistory.data) {
        let overview = document.createElement('li', {is: 'match-history-entry'});
        overview.fillData(entry);
        document.getElementById("matchHistoryList").append(overview); 
        console.log("added entry") 
    }
    
}