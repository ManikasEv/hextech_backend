const { neon } = require('@neondatabase/serverless');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sql = neon(process.env.DATABASE_URL);
        const projects = await sql`
            SELECT id, title, description, type, image_url, link, sort_order
            FROM projects
            ORDER BY sort_order ASC
        `;
        res.status(200).json(projects);
    } catch (err) {
        console.error('DB error:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
};
