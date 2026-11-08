# PRISCIENCE Learning Hub

A class-wise website for sharing PPT, PDF and video lessons for Classes 6, 7 and 8.

## Features
- Public student library, separated by class
- Search and filter by videos or presentations
- Admin sign-in and uploads
- Video playback and PDF viewing in the browser
- Admin delete controls
- Responsive dark theme using the supplied PRISCIENCE logo

## Run locally
Requires Node.js 18 or newer.

```bash
npm install
```

Set an admin password, then start:

**macOS / Linux**
```bash
ADMIN_PASSWORD="choose-a-strong-password" SESSION_SECRET="use-a-long-random-secret" npm start
```

**Windows PowerShell**
```powershell
$env:ADMIN_PASSWORD="choose-a-strong-password"
$env:SESSION_SECRET="use-a-long-random-secret"
npm start
```

Open http://localhost:3000

## Publish it online
Deploy this Node.js project to a host that supports persistent disk storage (for example, a VPS). Configure:
- `ADMIN_PASSWORD`: a strong, private admin password
- `SESSION_SECRET`: a long random secret
- `NODE_ENV=production`
- Persistent storage for `priscience.db` and `public/uploads`

Do not use an ephemeral filesystem: uploaded lessons and the database can disappear on some hosting plans. Use HTTPS. For larger audiences, move uploaded files to object storage and use a managed database.

## File notes
- Accepted: `.ppt`, `.pptx`, `.pdf`, `.mp4`, `.webm`, `.mov`
- Maximum upload size: 500 MB
- Videos play in the website.
- PDFs preview in the website.
- PowerPoint files can be downloaded/opened. An embedded Office Online preview requires a publicly hosted file URL and may depend on Microsoft's viewer availability.

## Important
This is a starter project, not a hosted live website. It does not yet include student accounts, teacher-specific permissions, malware scanning, or automated PPT-to-PDF conversion. Anyone can view published resources; only the admin password allows uploads and deletion.
