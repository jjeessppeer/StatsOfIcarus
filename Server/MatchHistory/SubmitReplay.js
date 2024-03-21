
const mongodb = require("mongodb");
const acmi = require("../Acmi/acmi");

async function submitReplay(mongoClient, acmiString, matchId, insertionLock) {
    try {
        await insertionLock.acquire();
        return await executeSubmission(mongoClient, acmiString, matchId);
    }
    catch (err) {
        console.log(err);
        return false;
    }
    finally {
        insertionLock.release();
    }
}

async function executeSubmission(mongoClient, acmiString, matchId) {
    const db = mongoClient.db("mhtest");
    const bucket = new mongodb.GridFSBucket(db, { bucketName: 'fsReplays' });

    // Check if replay has already been submitted.
    const cursor = bucket.find({ filename: matchId });
    const doc = await cursor.next();
    if (doc) {
        return true;
    }

    if (!acmi.isValidAcmi(acmiString)) {
        return false;
    }

    const stream = bucket.openUploadStream(matchId, { metadata: { MatchId: matchId } })
    stream.write(acmiString);
    stream.end();

    // Update match doc to indicate replay exists.
    const matchesCollection = db.collection("Matches");
    let match = await matchesCollection.findOne({ MatchId: matchId });
    if (match && !match.ReplaySaved) {
        await matchesCollection.updateOne(
            { MatchId: matchId },
            { $set: { ReplaySaved: true } });
    }
}

module.exports = {
    submitReplay
}