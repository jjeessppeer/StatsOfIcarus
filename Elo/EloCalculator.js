// TODO: special case AI player.

function getNewRankings(rankings, points) {
    const team1Ranking = getTeamRanking(rankings[0]);
    const team2Ranking = getTeamRanking(rankings[1]);

    const team1Points = points[0];
    const team2Points = points[1];

    const {delta, expectedOutcome, actualOutcome} = getRankingDelta(team1Ranking, team2Ranking, team1Points, team2Points);

    updateRanking(rankings[0], delta);
    updateRanking(rankings[1], -delta);
    return {
        rankings,
        delta,
        expectedOutcome,
        actualOutcome,
        teamDiff: team1Ranking - team2Ranking
    };
}

function updateRanking(playerRankings, delta) {
    // TODO: fancier point distribution. 
    // Lower ranker player should gain more or lose less
    for(let i = 0; i < 8; i += 1) {
        playerRankings[i] += delta;
    }
}

function getRankingDelta(t1Ranking, t2Ranking, t1Points, t2Points) {
    const expectedOutcome = 1 / (1 + Math.pow(10, (t1Ranking - t2Ranking) / 400));
    const actualOutcome = t1Points / (t1Points + t2Points);
    
    const k = 10;
    const delta = Math.floor(k * (actualOutcome - expectedOutcome));

    return { delta, expectedOutcome, actualOutcome };
}

function getTeamRanking(playerRankings) {
    // TODO: test with geometric mean instead.
    let teamRanking = 0;
    // for (let i = 0; i < 4; i += 1) {
    //     // Pilot
    //     if (i  % 4 == 0) 
    //         teamRanking += 2 * playerRankings[i];
    //     // Regular crew
    //     else 
    //         teamRanking += playerRankings[i];
    // }
    for (let i = 0; i < 4; i += 1) {
        teamRanking += playerRankings[i];
    }
    teamRanking /= 8;
    return teamRanking;
}

module.exports = {
    getNewRankings
}