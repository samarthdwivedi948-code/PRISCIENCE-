const express = require("express");
const session = require("express-session");
const multer = require("multer");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error("Set ADMIN_PASSWORD before starting the server.");
  process.exit(1);
}

const uploadDir = path.join(__dirname, "public", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const db = new Database(path.join(__dirname, "priscience.db"));
db.exec(`CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  className TEXT NOT NULL,
  type TEXT NOT NULL,
  filename TEXT NOT NULL,
  originalName TEXT NOT NULL,
  createdAt TEXT NOT NULL
)`);

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 }
}));
app.use(express.static(path.join(__dirname, "public")));

const allowed = new Set([".ppt", ".pptx", ".pdf", ".mp4", ".webm", ".mov"]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${ext}`);
  }
});
const uploader = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(allowed.has(ext) ? null : new Error("Only PPT, PPTX, PDF, MP4, WEBM and MOV files are allowed."), allowed.has(ext));
  }
});
const requireAdmin = (req, res, next) => req.session && req.session.admin ? next() : res.status(401).json({ error: "Admin login required." });

app.post("/api/login", (req, res) => {
  const submitted = String(req.body.password || "");
  const a = Buffer.from(submitted), b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: "Incorrect password." });
  req.session.admin = true;
  res.json({ ok: true });
});
app.post("/api/logout", requireAdmin, (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/me", (req, res) => res.json({ admin: !!(req.session && req.session.admin) }));

app.get("/api/lessons", (req, res) => {
  const cls = req.query.class;
  const rows = cls && ["6", "7", "8"].includes(String(cls))
    ? db.prepare("SELECT * FROM lessons WHERE className=? ORDER BY id DESC").all(String(cls))
    : db.prepare("SELECT * FROM lessons ORDER BY id DESC").all();
  res.json(rows.map(x => ({ ...x, url: `/uploads/${encodeURIComponent(x.filename)}` })));
});

app.post("/api/lessons", requireAdmin, uploader.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choose a file first." });
  const title = String(req.body.title || "").trim().slice(0, 120);
  const description = String(req.body.description || "").trim().slice(0, 500);
  const className = String(req.body.className || "");
  if (!title || !["6", "7", "8"].includes(className)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Add a title and choose Class 6, 7 or 8." });
  }
  const ext = path.extname(req.file.originalname).toLowerCase();
  const type = [".mp4", ".webm", ".mov"].includes(ext) ? "video" : "presentation";
  const info = db.prepare(`INSERT INTO lessons (title,description,className,type,filename,originalName,createdAt)
    VALUES (?,?,?,?,?,?,?)`).run(title, description, className, type, req.file.filename, req.file.originalname, new Date().toISOString());
  res.json({ ok: true, id: info.lastInsertRowid });
});

app.delete("/api/lessons/:id", requireAdmin, (req, res) => {
  const row = db.prepare("SELECT * FROM lessons WHERE id=?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Lesson not found." });
  const filePath = path.join(uploadDir, path.basename(row.filename));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare("DELETE FROM lessons WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || "Upload failed." });
});
app.listen(PORT, () => console.log(`PRISCIENCE running on port ${PORT}`));
