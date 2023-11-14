

function addPlayerToTeam(player, team) {
    player.team = team.teamIdx;
    team.balanceElo += player.balanceElo;
    team.realElo += player.realElo;
    team.playerNames.push(player.name);
    team.playerElos.push(player.realElo);
    team.memberCount += 1;
}

function getWorstTeam(teams, teamSize) {
    let min = undefined;
    let minIdx = undefined;
    for (const team of teams) {
        if (min == undefined || (team.balanceElo < min && team.memberCount < teamSize * 4)) {
            min = team.balanceElo;
            minIdx = team.teamIdx;
        }
    }
    console.log(minIdx);
    return teams[minIdx];
}

async function generateBalancedTeams(mongoClient, playerIds, randomness=100, teamCount=2, teamSize=2, keepPilots=true) {
    if (playerIds.length != teamCount * teamSize * 4) return [];
    const players = [];
    const teams = [];
    
    for (let i = 0; i < teamCount; i++) {
        teams.push({
            teamIdx: i,
            balanceElo: 0,
            realElo: 0,
            memberCount: 0,
            playerNames: [],
            playerElos: []
        });
    }

    // Load player data from ids.
    const playerCollection = mongoClient.db("mhtest").collection("Players");
    for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i];
        if (playerId == -1) continue; // ignore AI for lobby balance.

        const playerObj = await playerCollection.findOne( {_id: playerId} );

        let eloPoints, name;
        if (playerObj) {
            eloPoints = playerObj.ELORating.Overall.ELOPoints;
            name = playerObj.Name.substring(0, playerObj.Name.length-5);
        }
        else {
            eloPoints = 1000;
            name = "Unknown Player";
        }
        const elo_offset = Math.random() * 2 * randomness - randomness;
        const player = {
            name: name, 
            balanceElo: eloPoints + elo_offset,
            realElo: eloPoints
        };

        // Insert pilots to their team if option is enabled.
        if (keepPilots && i % 4 == 0) {
            const teamIdx = Math.floor(i / (teamSize * 4));
            addPlayerToTeam(player, teams[teamIdx]);
        }
        
        players.push(player);
        
    }
    console.log(players);

    // Add players to team to keep elo equal.
    players.sort((a, b) => b.balanceElo - a.balanceElo);
    for (const player of players) {
        if (player.team != undefined) continue;
        const team = getWorstTeam(teams, teamSize);
        addPlayerToTeam(player, team);
    }
    
    console.log(teams);
    return teams;
}

module.exports = {
    generateBalancedTeams
}