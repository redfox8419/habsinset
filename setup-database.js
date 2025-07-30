// setup-database.js – creates DB, runs schema, seeds starter data
const sqlite3 = require('sqlite3').verbose();
const path     = require('path');
const fs       = require('fs');

const dbDir      = path.join(__dirname, 'db');
const dbPath     = path.join(dbDir, 'prompts.db');
const schemaPath = path.join(dbDir, 'create-db.sql');

if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new sqlite3.Database(dbPath, err => {
  if (err) throw err;
  console.log('Connected to SQLite:', dbPath);
});

// Promise wrapper for db.run
function run(db, sql, params = []) {
  return new Promise((res, rej) =>
    db.run(sql, params, function (err) {
      if (err) rej(err);
      else    res(this);
    })
  );
}

// Promise wrapper for db.exec (multiple statements)
function exec(db, sql) {
  return new Promise((res, rej) =>
    db.exec(sql, err => (err ? rej(err) : res()))
  );
}

// Promise wrapper for db.all
function all(db, sql, params = []) {
  return new Promise((res, rej) =>
    db.all(sql, params, (err, rows) => (err ? rej(err) : res(rows)))
  );
}

(async () => {
  // 1️⃣ Load & run full schema
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  await run(db, 'PRAGMA foreign_keys = ON;');
  await exec(db, schemaSQL);
  console.log('Schema executed.');

  // 2️⃣ Seed categories
  console.log('Seeding starter data...');
  const categoriesSeed = [
    ['Mathematics','subject','fa-calculator','#3b82f6'],
    ['English','subject','fa-book','#10b981'],
    ['Science','subject','fa-flask','#8b5cf6'],
    ['History','subject','fa-landmark','#f59e0b'],
    ['Geography','subject','fa-globe','#06b6d4'],
    ['Languages','subject','fa-language','#ec4899'],
    ['Art & Design','subject','fa-palette','#f43f5e'],
    ['Music','subject','fa-music','#a855f7'],
    ['PE & Sports','subject','fa-running','#22c55e'],
    ['Computer Science','subject','fa-code','#6366f1'],
    ['Lesson Planning','purpose','fa-chalkboard-teacher','#3b82f6'],
    ['Resource Creation','purpose','fa-file-alt','#10b981'],
    ['Assessment','purpose','fa-clipboard-check','#f59e0b'],
    ['Feedback','purpose','fa-comments','#8b5cf6'],
    ['Time Savers','purpose','fa-clock','#ef4444'],
    ['Admin Tasks','purpose','fa-tasks','#06b6d4'],
    ['Differentiation','purpose','fa-users','#ec4899'],
    ['Parent Communication','purpose','fa-envelope','#a855f7'],
    ['Primary','grade_level','fa-child','#10b981'],
    ['Secondary','grade_level','fa-graduation-cap','#3b82f6'],
    ['Sixth Form','grade_level','fa-university','#8b5cf6']
  ];
  for (const row of categoriesSeed) {
    await run(
      db,
      `INSERT OR IGNORE INTO categories (name,type,icon,color)
       VALUES (?,?,?,?)`,
      row
    );
  }

  // 3️⃣ Seed default user
  await run(
    db,
    `INSERT OR IGNORE INTO users
     (email,name,school,department)
     VALUES ('admin@habsai.com',
             'Admin User',
             'Haberdashers',
             'Technology')`
  );
  const users = await all(
    db,
    `SELECT id FROM users WHERE email = ?`,
    ['admin@habsai.com']
  );
  const userId = users[0].id;

  // 4️⃣ Seed sample prompts
  const samplePrompts = [ /* same array as before */ ];
  for (const p of samplePrompts) {
    const res = await run(
      db,
      `INSERT INTO prompts
       (title,description,prompt_text,user_id,time_saved,
        difficulty_level,ai_tool,tips,example_output)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        p.title, p.description, p.prompt_text, userId,
        p.time_saved, p.difficulty_level, p.ai_tool,
        p.tips || null, p.example_output || null
      ]
    );
    for (const catId of p.categories) {
      await run(
        db,
        `INSERT INTO prompt_categories (prompt_id,category_id)
         VALUES (?,?)`,
        [res.lastID, catId]
      );
    }
  }

  // 5️⃣ Seed tags
  const tags = ['quick-win','exam-prep','homework','revision','creative','stem','literacy'];
  for (const t of tags) {
    await run(db, `INSERT OR IGNORE INTO tags (name) VALUES (?)`, [t]);
  }

  console.log('Seeding complete.');
  db.close(() => console.log('Database ready ✔︎  Run: npm start'));
})().catch(err => {
  console.error(err);
  db.close();
  process.exit(1);
});
