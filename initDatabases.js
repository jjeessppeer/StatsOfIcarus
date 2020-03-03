
const sqlite = require('better-sqlite3');
const access_db = new sqlite('databases/access_db.db', { verbose: null });
const user_db = new sqlite('databases/user_db.db', { verbose: null });
const build_db = new sqlite('databases/build_db.db', { verbose: null });
const data_db = new sqlite('databases/data_db.db', { verbose: null });
// const account_db = new sqlite('databases/data_db.db', { verbose: null });






user_db.prepare(`
	CREATE TABLE accounts (
		username TEXT PRIMARY KEY,
		password TEXT,
		salt TEXT,
		token TEXT
	);`).run();

user_db.prepare(`
	CREATE TABLE ip_accounts (
		ip TEXT PRIMARY KEY,
		token TEXT
	);`).run();

user_db.prepare(`
	CREATE TABLE login_tries (
		ip TEXT,
		username TEXT,
		successful BOOLEAN,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP 
	);`).run();


user_db.prepare(`
    CREATE TABLE users (
	  token TEXT PRIMARY KEY,
	  username TEXT,
	  display_name TEXT,
	  ips TEXT,
	  registered BOOLEAN DEFAULT 0,
      n_visits INTEGER DEFAULT 1,
      first_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
	  last_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
	  upvoted_ids TEXT DEFAULT '{}',
	  submitted_builds TEXT DEFAULT '[]',
	  banned BOOLEAN DEFAULT 0
	);`).run();
	
access_db.prepare(`
	CREATE TABLE accesses (
		ip TEXT NOT NULL,
		time DATETIME DEFAULT CURRENT_TIMESTAMP
	);`).run();

// Initialize build database

build_db.prepare(`
CREATE TABLE ship_builds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_time DATETIME DEFAULT CURRENT_TIMESTAMP,
	submitter_token TEXT NOT NULL,
    name TEXT NOT NULL,
    ship_type TEXT NOT NULL,
    pve BOOLEAN NOT NULL,
    build_code TEXT NOT NULL,
    description TEXT NOT NULL,
    comp_votes INTEGER DEFAULT 0,
    fun_votes INTEGER DEFAULT 0,
    public BOOLEAN DEFAULT 0
    );`).run();

build_db.prepare(`
    CREATE TABLE ship_builds_removals (
    removal_time DATETIME,
    id INTEGER PRIMARY KEY,
    submission_time DATETIME,
    submitter_token TEXT NOT NULL,
    name TEXT NOT NULL,
    ship_type TEXT NOT NULL,
    pve BOOLEAN NOT NULL,
    build_code TEXT NOT NULL,
    description TEXT NOT NULL,
    comp_votes INTEGER NOT NULL,
    fun_votes INTEGER NOT NULL,
    public BOOLEAN NOT NULL
    );`).run();

// Initialize data db

data_db.prepare(`CREATE TABLE "Ammo_stats" (
	"Name"	TEXT,
	"Alias"	TEXT,
	"Rotationspeed"	INTEGER,
	"Jitter"	INTEGER,
	"Clipsize"	INTEGER,
	"AOEradius"	INTEGER,
	"AOEdamage"	INTEGER,
	"Damage"	INTEGER,
	"Armingtime"	INTEGER,
	"Rateoffire"	INTEGER,
	"Projectilespeed"	INTEGER,
	"Firemodifier"	INTEGER,
	"Firedamage"	INTEGER,
	"Lift"	INTEGER,
	"Directdamage"	INTEGER,
	"Range"	INTEGER,
	"Rotationalarcs"	INTEGER
)`).run();
data_db.prepare(`CREATE TABLE "Component_stats" (
	"Name"	TEXT,
	"HP"	INTEGER
)`).run();
data_db.prepare(`CREATE TABLE "Crosshair_data" (
	"Name"	TEXT,
	"Degperpixel"	INTEGER,
	"Starty"	INTEGER,
	"Startx"	INTEGER,
	"Endx"	INTEGER,
	"Image"	TEXT
)`).run();
data_db.prepare(`CREATE TABLE "Damage_types" (
	"Name"	TEXT,
	"Balloon"	INTEGER,
	"Hull"	INTEGER,
	"Armor"	INTEGER,
	"Components"	INTEGER
)`).run();
data_db.prepare(`CREATE TABLE "Gun_stats" (
	"Name"	TEXT,
	"Alias"	TEXT,
	"Mode"	TEXT,
	"Weaponslot"	TEXT,
	"Damagetypeprimary"	TEXT,
	"Damageprimary"	INTEGER,
	"Damagetypesecondary"	TEXT,
	"Damagesecondary"	INTEGER,
	"Rateoffire"	INTEGER,
	"Reloadtime"	INTEGER,
	"Magazinesize"	INTEGER,
	"Fireprimary"	INTEGER,
	"Firesecondary"	INTEGER,
	"Projectilespeed"	INTEGER,
	"Range"	INTEGER,
	"Shelldrop"	INTEGER,
	"AOEradius"	INTEGER,
	"Buckshot"	INTEGER,
	"Armingtime"	REAL,
	"Sideangle"	INTEGER,
	"Upangle"	INTEGER,
	"Downangle"	INTEGER
)`).run();
data_db.prepare(`CREATE TABLE "Map_data" (
	"Name"	TEXT,
	"Fullname"	TEXT,
	"Gamemode"	TEXT,
	"Mapimage"	TEXT,
	"Imagesrc"	TEXT,
	"Spawnimagesrc"	TEXT,
	"Mapscale(m/px)"	TEXT
)`).run();
data_db.prepare(`CREATE TABLE "Match_history" (
	"Timestamp"	TEXT,
	"Dateofmatch"	TEXT,
	"Event"	TEXT,
	"Teamscores[Team1score]"	INTEGER,
	"Teamscores[Team2score]"	INTEGER,
	"T1Ship1"	TEXT,
	"T1Ship2"	TEXT,
	"T2Ship1"	TEXT,
	"T2Ship2"	TEXT,
	"T1S1Pilot"	TEXT,
	"T1S2Pilot"	INTEGER,
	"T2S1Pilot"	TEXT,
	"T2S2Pilot"	TEXT
)`).run();
data_db.prepare(`CREATE TABLE "Ship_Stats" (
	"ShipType"	TEXT,
	"Armor"	INTEGER,
	"ArmorRebuildValue"	INTEGER,
	"HullHealth"	INTEGER,
	"LightWeapons"	INTEGER,
	"HeavyWeapons"	INTEGER,
	"LongitudinalSpeed(m/s)"	INTEGER,
	"LongitudinalAcceleration(m/s²)"	INTEGER,
	"TurnSpeed(deg/s)"	INTEGER,
	"TurnAcceleration(deg/s²)"	INTEGER,
	"VerticalSpeed(m/s)"	INTEGER,
	"VerticalAcceleration(m/s²)"	INTEGER,
	"Mass(t)"	INTEGER
)`).run();
data_db.prepare(`CREATE TABLE "Ships_gun_angles" (
	"Ship"	TEXT,
	"Nguns"	INTEGER,
	"Angle1"	REAL,
	"Angle2"	INTEGER,
	"Angle3"	INTEGER,
	"Angle4"	TEXT,
	"Angle5"	TEXT,
	"Angle6"	TEXT,
	"Position1"	TEXT,
	"Position2"	TEXT,
	"Position3"	TEXT,
	"Position4"	TEXT,
	"Position5"	TEXT,
	"Position6"	TEXT,
	"Slot1"	TEXT,
	"Slot2"	TEXT,
	"Slot3"	TEXT,
	"Slot4"	TEXT,
	"Slot5"	TEXT,
	"Slot6"	TEXT
)`).run();
data_db.prepare(`CREATE TABLE "Tool_stats" (
	"Name"	TEXT,
	"Repair"	INTEGER,
	"Rebuild"	INTEGER,
	"Extinguish"	INTEGER,
	"Fireimmunity"	INTEGER,
	"Cooldown"	INTEGER
)`).run();


