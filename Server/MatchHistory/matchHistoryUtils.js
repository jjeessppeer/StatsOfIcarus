async function getPlayerIdFromName(mongoClient, name, exactMatch=false) {
    const playersCollection = mongoClient.db("mhtest").collection("Players");
    let player;
    if (exactMatch) {
        name = name + " [PC]";
        player = await playersCollection.findOne({ Name: name });
    }
    else {
        // Escape characters before searching
        let queryString = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        player = await playersCollection.findOne(
            { "Name": new RegExp(queryString, "i") },
            { _id: true });
    }
    if (player) return player._id;
    return undefined;
}


module.exports = {
    getPlayerIdFromName
}