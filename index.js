require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { neon } = require('@neondatabase/serverless');

const app = express();
const sql = neon(process.env.DATABASE_URL);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Multer: store file in memory, convert to base64
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files allowed'));
    },
});

// ── Helper ───────────────────────────────────────────────────────────────────
function fileToBase64(file) {
    return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/projects
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

// GET /api/projects/:id
app.get('/api/projects/:id', async (req, res) => {
    try {
        const [project] = await sql`
            SELECT * FROM projects WHERE id = ${req.params.id}
        `;
        if (!project) return res.status(404).json({ error: 'Not found' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// POST /api/projects  (multipart/form-data with optional image file)
app.post('/api/projects', upload.single('image'), async (req, res) => {
    try {
        const { title, description, type, link, sort_order } = req.body;
        if (!title || !description || !type) {
            return res.status(400).json({ error: 'title, description and type are required' });
        }

        const image_data = req.file ? fileToBase64(req.file) : (req.body.image_data || null);
        const image_url  = req.body.image_url || null;
        const order      = sort_order ? parseInt(sort_order) : 999;

        const [created] = await sql`
            INSERT INTO projects (title, description, type, image_url, image_data, link, sort_order)
            VALUES (${title}, ${description}, ${type}, ${image_url}, ${image_data}, ${link || null}, ${order})
            RETURNING *
        `;
        res.status(201).json(created);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// PUT /api/projects/:id  (multipart/form-data)
app.put('/api/projects/:id', upload.single('image'), async (req, res) => {
    try {
        const { title, description, type, link, sort_order, image_url, keep_image } = req.body;

        // Decide image_data: new upload > keep existing > null
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
                title       = ${title},
                description = ${description},
                type        = ${type},
                image_url   = ${image_url || null},
                image_data  = ${image_data},
                link        = ${link || null},
                sort_order  = ${sort_order ? parseInt(sort_order) : 999}
            WHERE id = ${req.params.id}
            RETURNING *
        `;
        if (!updated) return res.status(404).json({ error: 'Not found' });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// DELETE /api/projects/:id
app.delete('/api/projects/:id', async (req, res) => {
    try {
        await sql`DELETE FROM projects WHERE id = ${req.params.id}`;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Health
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

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
            FROM testimonials WHERE approved = true ORDER BY created_at DESC
        `;
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
});

app.post('/api/testimonials', upload.single('photo'), async (req, res) => {
    try {
        const { name, company, rating, message } = req.body;
        if (!name || !rating || !message) return res.status(400).json({ error: 'name, rating and message are required' });
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

app.patch('/api/testimonials/:id/approve', async (req, res) => {
    try {
        const [row] = await sql`UPDATE testimonials SET approved = true WHERE id = ${req.params.id} RETURNING *`;
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

// Root welcome
app.get('/', (_, res) => {
    res.json({
        message: 'Hello! Welcome to the Hextech API.',
        endpoints: [
            'GET  /api/projects',
            'GET  /api/projects/:id',
            'POST /api/projects',
            'PUT  /api/projects/:id',
            'DELETE /api/projects/:id',
            'GET  /api/health',
        ],
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
