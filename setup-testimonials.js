require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
    await sql`
        CREATE TABLE IF NOT EXISTS testimonials (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            company TEXT,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            message TEXT NOT NULL,
            approved BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    `;
    console.log('✅ testimonials table ready');
    process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
