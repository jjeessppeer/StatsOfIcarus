
const sqlite = require('better-sqlite3');
const access_db = new sqlite('databases/access_db.db', { verbose: null });
const user_db = new sqlite('databases/user_db.db', { verbose: null });
const build_db = new sqlite('databases/build_db.db', { verbose: null });




// Initialize access database

user_db.prepare(`
    CREATE TABLE users (
	  username TEXT PRIMARY KEY,
	  ips TEXT,
      n_visits INTEGER DEFAULT 1,
      first_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
	  last_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
	  upvoted_ids TEXT DEFAULT '[]',
	  banned BOOLEAN DEFAULT 0
	);`).run();

user_db.prepare(`
	CREATE TABLE ip_name_map (
		ip TEXT PRIMARY KEY,
		username TEXT NOT NULL
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
    submitter_username TEXT NOT NULL,
    name TEXT NOT NULL,
    ship_type TEXT NOT NULL,
    pve BOOLEAN NOT NULL,
    build_code TEXT NOT NULL,
    description TEXT NOT NULL,
    upvotes INTEGER NOT NULL,
    public BOOLEAN NOT NULL
    );`).run();

build_db.prepare(`
    CREATE TABLE ship_builds_removals (
    removal_time DATETIME,
    id INTEGER PRIMARY KEY,
    submission_time DATETIME,
    submitter_username TEXT NOT NULL,
    name TEXT NOT NULL,
    ship_type TEXT NOT NULL,
    pve BOOLEAN NOT NULL,
    build_code TEXT NOT NULL,
    description TEXT NOT NULL,
    upvotes INTEGER NOT NULL,
    public BOOLEAN NOT NULL
    );`).run();
