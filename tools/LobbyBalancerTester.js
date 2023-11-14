async function start() {
    let response = await fetch('http://localhost/balance_lobby', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            playerIds: [
                863213, 179212, 860305, 215239, 
                555828, 1584039, 809718, 1569116, 
                // 1383872, 1529259, -1, -1,
                // 604312, -1, -1, -1
            ], 
            randomness: 100,
            keepPilots: false,
            teamCount: 2,
            teamSize: 1
        })
    });
    // console.log(response);
    let json = await response.json();
    console.log(json);
}

start();