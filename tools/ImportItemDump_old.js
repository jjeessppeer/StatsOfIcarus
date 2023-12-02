require('dotenv').config();
const fs = require('fs');
let data = JSON.parse(fs.readFileSync('jsonDump.json'));
const Jimp = require("jimp");
const { MongoClient } = require("mongodb");
const db_url = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@${process.env.MONGODB_ADRESS}/`;
// const db_url = `mongodb://localhost:27017/`;
let client = new MongoClient(db_url);

function extractIcon(item) {
    let iconName = item.IconPath.substring(item.IconPath.lastIndexOf('/') + 1);
    let srcPath = `./icons/${iconName}.png`;
    let dstPath = `./icons-used/${iconName}.png`;


    if (!fs.existsSync(srcPath)) {
        console.log(`No file ${iconName}`);
        item.IconPath = "";
        return;
    }
    console.log(`Copying ${srcPath} -> ${dstPath}`);
    fs.copyFileSync(srcPath, dstPath);
}

function fixIconPath(item) {
    if (item.IconPath == "") return;
    item.IconPath = item.IconPath.substring(item.IconPath.lastIndexOf('/') + 1) + ".jpg";
}

function filterIcons() {
    for (let item of data.Maps){
        extractIcon(item);
    }
    for (let item of data.Ships){
        extractIcon(item);
    }
    for (let item of data.Guns){
        extractIcon(item);
    }
    for (let item of data.Skills){
        extractIcon(item);
    }
}

function fixItems(){
    for (let item of data.Maps){
        fixIconPath(item);
        item._id = item.Id;
    }
    for (let item of data.Ships){
        fixIconPath(item);
        item._id = item.Id;
    }
    for (let item of data.Guns){
        fixIconPath(item);
        item._id = item.Id;
    }
    for (let item of data.Skills){
        fixIconPath(item);
        item._id = item.Id;
    }
    fs.writeFileSync('./item-data.json', JSON.stringify(data));

}

function generateJpegs() {
    let dir = "./icons-used/";
    let outputDir = "./icons-jpeg/"
    fs.readdir(dir, (err, files) => {
        if (err) {
            throw err;
        }
        files.forEach(file => {
            let src = dir + file;
            Jimp.read(src, function (err, image) {
                if (err) {
                  
                    // Return if any error
                    console.log(err);
                    return;
                }
                let outFile = file.substring(0, file.lastIndexOf('.')) + ".jpg"
                console.log(outFile)
                image.resize(100, 100).quality(80).write(outputDir + outFile);
                // image.write(outputDir + outFile);
            });
        });
    });
}

async function uploadItemSet(){
    let gunCollection = client.db("mhtest").collection("Items-Guns");
    let shipCollection = client.db("mhtest").collection("Items-Ships");
    let skillCollection = client.db("mhtest").collection("Items-Skills");
    let mapCollection = client.db("mhtest").collection("Items-Maps");

    await gunCollection.deleteMany({});
    await shipCollection.deleteMany({});
    await skillCollection.deleteMany({});
    await mapCollection.deleteMany({});
    console.log("Cleared item collection");

    await mapCollection.insertMany(data.Maps);
    await shipCollection.insertMany(data.Ships);
    await gunCollection.insertMany(data.Guns);
    await skillCollection.insertMany(data.Skills);
    console.log("Inserted data.");
}

async function insertAIPlayer(){
    let playerCollection = client.db("mhtest").collection("Players");
    let loadoutCollection = client.db("mhtest").collection("PlayerEquipment");
    
    await playerCollection.replaceOne(
        {  "_id": -1 },
        {  "_id": -1,  "Name": "AI [PC]",  "Clan": "",  "MaxLevel": 0,  "Levels": [    0,    0,    0  ]},
        {upsert: true});
    await loadoutCollection.replaceOne(
        { "_id": -1},
        {  "_id": -1,  "Class": 2,  "Skills": []},
        {upsert: true});
}

async function initializeDatabase(){
    // db.reviews.createIndex( { comments: "text" } )
}

async function run(){
    console.log("Connecting to db...");
    await client.connect();
    console.log("Connected to db.");

    filterIcons();
    // generateJpegs();
    fixItems();
    await uploadItemSet();
    await insertAIPlayer();

    await client.close();
}


run();
