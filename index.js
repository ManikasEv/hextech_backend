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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
