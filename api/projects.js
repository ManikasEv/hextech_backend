const { neon } = require('@neondatabase/serverless');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => fn(req, res, (r) => r instanceof Error ? reject(r) : resolve(r)));
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const sql = neon(process.env.DATABASE_URL);

    // ID comes from query string when routed via /api/projects/123 -> /api/projects?id=123
    const id = req.query?.id || null;

    try {
        if (req.method === 'GET' && !id) {
            const rows = await sql`SELECT id,title,description,type,image_url,image_data,link,sort_order FROM projects ORDER BY sort_order ASC`;
            return res.json(rows);
        }
        if (req.method === 'GET' && id) {
            const [row] = await sql`SELECT * FROM projects WHERE id=${id}`;
            return row ? res.json(row) : res.status(404).json({ error: 'Not found' });
        }
        if (req.method === 'POST') {
            await runMiddleware(req, res, upload.single('image'));
            const { title, description, type, link, sort_order, image_url } = req.body;
            const image_data = req.file
                ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
                : (req.body.image_data || null);
            const [row] = await sql`
                INSERT INTO projects (title,description,type,image_url,image_data,link,sort_order)
                VALUES (${title},${description},${type},${image_url||null},${image_data},${link||null},${sort_order ? parseInt(sort_order) : 999})
                RETURNING *
            `;
            return res.status(201).json(row);
        }
        if (req.method === 'PUT' && id) {
            await runMiddleware(req, res, upload.single('image'));
            const { title, description, type, link, sort_order, image_url, keep_image } = req.body;
            let image_data = null;
            if (req.file) {
                image_data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
            } else if (keep_image === 'true') {
                const [ex] = await sql`SELECT image_data FROM projects WHERE id=${id}`;
                image_data = ex?.image_data ?? null;
            } else if (req.body.image_data) {
                image_data = req.body.image_data;
            }
            const [row] = await sql`
                UPDATE projects SET
                    title=${title}, description=${description}, type=${type},
                    image_url=${image_url||null}, image_data=${image_data},
                    link=${link||null}, sort_order=${sort_order ? parseInt(sort_order) : 999}
                WHERE id=${id} RETURNING *
            `;
            return row ? res.json(row) : res.status(404).json({ error: 'Not found' });
        }
        if (req.method === 'DELETE' && id) {
            await sql`DELETE FROM projects WHERE id=${id}`;
            return res.json({ success: true });
        }
        res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
