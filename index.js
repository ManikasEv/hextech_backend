require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();
const sql = neon(process.env.DATABASE_URL);

app.use(cors());
app.use(express.json());

// GET /api/projects — returns all projects ordered by sort_order
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await sql`
            SELECT id, title, description, type, image_url, link, sort_order
            FROM projects
            ORDER BY sort_order ASC
        `;
        res.json(projects);
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
