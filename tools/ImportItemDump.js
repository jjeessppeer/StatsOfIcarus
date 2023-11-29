
const { MongoClient } = require("mongodb");
const { MONGODB_URL_STRING } = require("./../config.json");
const fs = require('fs');
const mongoClient = new MongoClient(MONGODB_URL_STRING);

async function importItems() {
  const data = JSON.parse(fs.readFileSync('./jsonDump.json'));

  console.log("Fixing item data...")
  fixItems(data);
  const gunCollection = mongoClient.db("mhtest").collection("Items-Guns");
  const shipCollection = mongoClient.db("mhtest").collection("Items-Ships");
  const skillCollection = mongoClient.db("mhtest").collection("Items-Skills");
  const mapCollection = mongoClient.db("mhtest").collection("Items-Maps");

  console.log("Clearing item collections...");
  await gunCollection.deleteMany({});
  await shipCollection.deleteMany({});
  await skillCollection.deleteMany({});
  await mapCollection.deleteMany({});

  console.log("Inserting new data...");
  await mapCollection.insertMany(data.Maps);
  await shipCollection.insertMany(data.Ships);
  await gunCollection.insertMany(data.Guns);
  await skillCollection.insertMany(data.Skills);
}

function fixItems(data) {
  for (const key in data) {
    for (const item of data[key]) {
      if (item.IconPath != "")
        item.IconPath = item.IconPath.substring(item.IconPath.lastIndexOf('/') + 1) + ".jpg";
        item._id = item.Id;
    }
  }
}

function fixIconPath(item) {
  if (item.IconPath == "") return;
  item.IconPath = item.IconPath.substring(item.IconPath.lastIndexOf('/') + 1) + ".jpg";
}





async function start() {
  try {
    console.log("Connecting to db...")
    await mongoClient.connect();
    console.log("Connected.");
    await importItems(mongoClient);

  } finally {
    mongoClient.close();
  }
}
start().catch(console.dir);