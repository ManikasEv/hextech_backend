require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function fix() {
    await sql`UPDATE projects SET image_url = 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?q=80&w=800&auto=format&fit=crop' WHERE title = 'Portfolio'`;
    await sql`UPDATE projects SET image_url = 'https://images.unsplash.com/photo-1545389336-cf090694435e?q=80&w=800&auto=format&fit=crop' WHERE title = 'Inside Observation'`;
    await sql`UPDATE projects SET image_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop' WHERE title = 'Papageorgiou Fugen'`;
    console.log('Image URLs updated');
    process.exit(0);
}
fix().catch(e => { console.error(e); process.exit(1); });
