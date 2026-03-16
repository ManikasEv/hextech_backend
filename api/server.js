require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { neon } = require('@neondatabase/serverless');

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files allowed'));
    },
});

function fileToBase64(file) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

// ── Welcome ───────────────────────────────────────────────────────────────────
app.get('/', (_, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hextech API</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #000a16; color: #fff; font-family: 'Courier New', monospace; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    .logo { font-size: 2.5rem; font-weight: 700; color: #00e5ff; letter-spacing: 0.2em; margin-bottom: 0.5rem; }
    .tagline { font-size: 1rem; color: #ffffff88; margin-bottom: 2.5rem; }
    .welcome { font-size: 1.1rem; color: #fff; margin-bottom: 2rem; }
    .endpoints { background: #0a1628; border: 1px solid #00e5ff22; border-radius: 12px; padding: 1.5rem 2rem; display: inline-block; text-align: left; }
    .endpoints h3 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: #00e5ff88; margin-bottom: 1rem; }
    .endpoint { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.6rem; font-size: 0.9rem; }
    .endpoint:last-child { margin-bottom: 0; }
    .method { font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; min-width: 48px; text-align: center; }
    .get  { background: #00e5ff22; color: #00e5ff; }
    .post { background: #00ff8822; color: #00ff88; }
    .put  { background: #ffaa0022; color: #ffaa00; }
    .del  { background: #ff444422; color: #ff6666; }
    .patch { background: #aa44ff22; color: #cc88ff; }
    .path { color: #ffffffcc; }
    .status { margin-top: 2rem; font-size: 0.75rem; color: #ffffff44; }
    .dot { display: inline-block; width: 8px; height: 8px; background: #00ff88; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">HEXTECH</div>
    <div class="tagline">Backend API — Vercel Serverless</div>
    <p class="welcome">👋 Hello! Welcome to the Hextech API.</p>
    <div class="endpoints">
      <h3>Available Endpoints</h3>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/projects</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/projects/:id</span></div>
      <div class="endpoint"><span class="method post">POST</span><span class="path">/api/projects</span></div>
      <div class="endpoint"><span class="method put">PUT</span><span class="path">/api/projects/:id</span></div>
      <div class="endpoint"><span class="method del">DELETE</span><span class="path">/api/projects/:id</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/health</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/reviews</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/testimonials</span></div>
      <div class="endpoint"><span class="method post">POST</span><span class="path">/api/testimonials</span></div>
      <div class="endpoint"><span class="method get">GET</span><span class="path">/api/testimonials/all</span></div>
      <div class="endpoint"><span class="method patch">PATCH</span><span class="path">/api/testimonials/:id/approve</span></div>
    </div>
    <p class="status"><span class="dot"></span>All systems operational</p>
  </div>
</body>
</html>`);
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// ── Projects ──────────────────────────────────────────────────────────────────
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await sql`
            SELECT id, title, description, type, image_url, image_data, link, sort_order
            FROM projects ORDER BY sort_order ASC
        `;
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.get('/api/projects/:id', async (req, res) => {
    try {
        const [project] = await sql`SELECT * FROM projects WHERE id = ${req.params.id}`;
        if (!project) return res.status(404).json({ error: 'Not found' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

app.post('/api/projects', upload.single('image'), async (req, res) => {
    try {
        const { title, description, type, link, sort_order, image_url } = req.body;
        if (!title || !description || !type) {
            return res.status(400).json({ error: 'title, description and type are required' });
        }
        const image_data = req.file ? fileToBase64(req.file) : (req.body.image_data || null);
        const order = sort_order ? parseInt(sort_order) : 999;
        const [created] = await sql`
            INSERT INTO projects (title, description, type, image_url, image_data, link, sort_order)
            VALUES (${title}, ${description}, ${type}, ${image_url || null}, ${image_data}, ${link || null}, ${order})
            RETURNING *
        `;
        res.status(201).json(created);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

app.put('/api/projects/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, description, type, link, sort_order, image_url, keep_image } = req.body;
        let image_data = null;
        if (req.file) {
            image_data = fileToBase64(req.file);
        } else if (keep_image === 'true') {
            const [existing] = await sql`SELECT image_data FROM projects WHERE id = ${req.params.id}`;
            image_data = existing?.image_data ?? null;
        } else if (req.body.image_data) {
            image_data = req.body.image_data;
        }
        const [updated] = await sql`
            UPDATE projects SET
                title = ${title}, description = ${description}, type = ${type},
                image_url = ${image_url || null}, image_data = ${image_data},
                link = ${link || null}, sort_order = ${sort_order ? parseInt(sort_order) : 999}
            WHERE id = ${req.params.id} RETURNING *
        `;
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        await sql`DELETE FROM projects WHERE id = ${req.params.id}`;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// ── Google Reviews (proxied — keeps API key server-side) ──────────────────────
app.get('/api/reviews', async (req, res) => {
    const placeId = process.env.GOOGLE_PLACE_ID;
    const apiKey  = process.env.GOOGLE_API_KEY;

    if (!placeId || !apiKey) {
        return res.status(503).json({ error: 'Google Reviews not configured', reviews: [] });
    }

    try {
        const url = `https://places.googleapis.com/v1/places/${placeId}`;
        const response = await fetch(url, {
            headers: {
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,reviews',
            },
        });
        if (!response.ok) {
            const err = await response.text();
            console.error('[Google Places]', response.status, err);
            return res.status(502).json({ error: 'Google API error', reviews: [] });
        }
        const data = await response.json();
        const reviews = (data.reviews || []).map(r => ({
            author:  r.authorAttribution?.displayName || 'Anonymous',
            avatar:  r.authorAttribution?.photoUri    || null,
            rating:  r.rating,
            text:    r.text?.text || '',
            time:    r.relativePublishTimeDescription || '',
        }));
        res.json({ rating: data.rating, total: data.userRatingCount, reviews });
    } catch (err) {
        console.error('[Google Reviews]', err);
        res.status(500).json({ error: 'Failed to fetch reviews', reviews: [] });
    }
});

// ── Testimonials ──────────────────────────────────────────────────────────────
app.get('/api/testimonials/all', async (req, res) => {
    try {
        const rows = await sql`SELECT * FROM testimonials ORDER BY created_at DESC`;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
});

app.get('/api/testimonials', async (req, res) => {
    try {
        const rows = await sql`
            SELECT id, name, company, rating, message, photo, created_at
            FROM testimonials
            WHERE approved = true
            ORDER BY created_at DESC
        `;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
});

app.post('/api/testimonials', upload.single('photo'), async (req, res) => {
    try {
        const { name, company, rating, message } = req.body;
        if (!name || !rating || !message) {
            return res.status(400).json({ error: 'name, rating and message are required' });
        }
        const r = parseInt(rating);
        if (r < 1 || r > 5) return res.status(400).json({ error: 'rating must be 1-5' });
        const photo = req.file ? fileToBase64(req.file) : null;

        const [created] = await sql`
            INSERT INTO testimonials (name, company, rating, message, photo)
            VALUES (${name.trim()}, ${company?.trim() || null}, ${r}, ${message.trim()}, ${photo})
            RETURNING id, name, company, rating, message, photo, created_at
        `;
        res.status(201).json(created);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save testimonial' });
    }
});

// ── Testimonials admin (approve/delete) ───────────────────────────────────────
app.patch('/api/testimonials/:id/approve', async (req, res) => {
    try {
        const [row] = await sql`
            UPDATE testimonials SET approved = true WHERE id = ${req.params.id} RETURNING *
        `;
        if (!row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve' });
    }
});

app.delete('/api/testimonials/:id', async (req, res) => {
    try {
        await sql`DELETE FROM testimonials WHERE id = ${req.params.id}`;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

module.exports = app;
