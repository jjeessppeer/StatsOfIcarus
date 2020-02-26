
const sqlite = require('better-sqlite3');
const access_db = new sqlite('access_db.db', { verbose: null });
const build_db = new sqlite('build_db.db', { verbose: null });


function initializeTables(){
  access_db.prepare(`
    CREATE TABLE visitors (
      ip TEXT NOT NULL PRIMARY KEY,
      n_visits INTEGER,
      first_visit DATETIME,
      last_visit DATETIME
    );`).run();
  access_db.prepare(`
    CREATE TABLE accesses (
      ip TEXT NOT NULL,
      time DATETIME DEFAULT CURRENT_TIMESTAMP
    );`).run();

  build_db.prepare(`
    CREATE TABLE ship_builds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitter_ip TEXT NOT NULL,
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
      submitter_ip TEXT NOT NULL,
      name TEXT NOT NULL,
      ship_type TEXT NOT NULL,
      pve BOOLEAN NOT NULL,
      build_code TEXT NOT NULL,
      description TEXT NOT NULL,
      upvotes INTEGER NOT NULL,
      public BOOLEAN NOT NULL
      );`).run();

  build_db.prepare(`
      CREATE TABLE voters (
        ip TEXT NOT NULL,
        upvoted_ids TEXT NOT NULL
      );`).run();
}

initializeTables();