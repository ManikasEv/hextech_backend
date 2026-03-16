require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
    await sql`ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS photo TEXT`;
    console.log('✅ photo column added to testimonials');
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
