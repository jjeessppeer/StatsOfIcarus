// TODO: special case AI player.
const STARTING_ELO = 1000;
const K_VALUE = 30;
const DIFF_SCALE = 400


function getNewRankings(rankings, points) {
    const team1Ranking = getTeamRanking(rankings[0]);
    const team2Ranking = getTeamRanking(rankings[1]);

    const team1Points = points[0];
    const team2Points = points[1];

    const [delta, expectedOutcome, actualOutcome] = rateMatchup(team1Ranking, team2Ranking, team1Points, team2Points);

    const newTeam1Ranking = updateRanking(rankings[0], delta);
    const newTeam2Ranking = updateRanking(rankings[1], -delta);

    return [
        [newTeam1Ranking, newTeam2Ranking],
        delta,
        expectedOutcome,
        actualOutcome,
        team1Ranking - team2Ranking,
        [team1Ranking, team2Ranking]
    ];
}

function updateRanking(playerRankings, delta) {
    let coeffs = distributionCoefficient(playerRankings);

    let newRanking = [];
    let deltas = [];
    for(let i = 0; i < playerRankings.length; i += 1) {
        const deltaScale = 1 + coeffs[i] * Math.sign(delta);
        const playerDelta = Math.round(deltaScale * delta);
        newRanking.push(playerRankings[i] + playerDelta);
        deltas.push(playerDelta);
    }
    return newRanking;
}

function distributionCoefficient(playerRankings) {
    const MAX_PENALTY = 0.15;
    const DIFF_SCALE = 200;

    const sum = playerRankings.reduce((a, b) => a + b, 0);
    const avgRank = (sum / playerRankings.length) || 0;
    
    // Calculate point distribution coefficients.
    const coeffs = [];
    let targetSum = playerRankings.length
    for (const rank of playerRankings) {
        const c = ( 1/2 - 1 / (1 + Math.pow(10, (avgRank - rank) / DIFF_SCALE)) ) * 2 * MAX_PENALTY;
        coeffs.push(c);
    }

    // Calculate ratio between negative and positive coefficients.
    function getRatio(coeffs) {
        let posSum = 0;
        let negSum = 0;
        for (let i = 0; i < coeffs.length; i+=1) {
            if (coeffs[i] > 0) posSum += coeffs[i];
            if (coeffs[i] < 0) negSum -= coeffs[i];
        }
        let ratio = posSum / negSum;
        if (posSum > 0.01 || negSum > 0.01) return 1;
        return ratio;
    }
    let ratio = getRatio(coeffs);

    // Scale coefficients to keep zero sum. 
    // Negative and positive coefficients should sum to 0.
    for (let i = 0; i < coeffs.length; i+=1) {
        if (ratio > 1 && coeffs[i] > 0) coeffs[i] /= ratio;
        if (ratio < 1 && coeffs[i] < 0) coeffs[i] /= ratio;
    }
    
    return coeffs;
}

function rateMatchup(t1Ranking, t2Ranking, t1Points, t2Points) {
    const expectedOutcome = 1 / (1 + Math.pow(10, (t2Ranking - t1Ranking) / DIFF_SCALE));

    // const actualOutcome = t1Points / (t1Points + t2Points);

    let actualOutcome = 0.5;
    if (t1Points == 5) actualOutcome = 1;
    else if (t2Points == 5) actualOutcome = 0;
    else {
        actualOutcome = t1Points / (t1Points + t2Points);
    }

    const delta = Math.ceil(K_VALUE * (actualOutcome - expectedOutcome));

    return [ delta, expectedOutcome, actualOutcome ];
}

function getTeamRanking(playerRankings, pilotWeight = 1, skipPlayers = []) {
    // TODO: test with geometric mean instead.
    let teamRanking = 0;
    const teamSize = playerRankings.length;
    // for (let i = 0; i < 4; i += 1) {
    //     // Pilot
    //     if (i  % 4 == 0) 
    //         teamRanking += 2 * playerRankings[i];
    //     // Regular crew
    //     else 
    //         teamRanking += playerRankings[i];
    // }
    for (let i = 0; i < teamSize; i += 1) {
        teamRanking += playerRankings[i];
    }
    teamRanking /= teamSize;
    return teamRanking;
}

module.exports = {
    getNewRankings,
    STARTING_ELO
}