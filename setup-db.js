require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function setup() {
    console.log('Creating projects table...');

    await sql`
        CREATE TABLE IF NOT EXISTS projects (
            id          SERIAL PRIMARY KEY,
            title       VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            type        VARCHAR(50) NOT NULL CHECK (type IN ('Website', 'Software')),
            image_url   TEXT,
            link        TEXT,
            sort_order  INTEGER DEFAULT 0,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        )
    `;

    console.log('Seeding projects...');

    // Clear existing and re-seed
    await sql`DELETE FROM projects`;

    await sql`
        INSERT INTO projects (title, description, type, image_url, link, sort_order) VALUES
        (
            'Portfolio',
            'Personal portfolio website showcasing creative work, projects, and professional achievements with modern design.',
            'Website',
            'https://portfoliomani.hextech.local',
            'https://www.manikasevangelos.com/',
            1
        ),
        (
            'Musician Portfolio',
            'Portfolio website for a professional musician — showcasing discography, events, and press kit.',
            'Website',
            'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop',
            NULL,
            2
        ),
        (
            'Inside Observation',
            'Professional website dedicated to energy therapies, holistic wellness, and spiritual healing services.',
            'Website',
            'https://ioinside.hextech.local',
            'https://insideobservation.com/',
            3
        ),
        (
            'AI Software Platform',
            'Advanced AI-powered software solution built with Flowise for intelligent automation and workflows.',
            'Software',
            'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
            NULL,
            4
        ),
        (
            'Booking & Invitation System',
            'Comprehensive software for managing bookings and sending automated invitations to clients.',
            'Software',
            'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop',
            NULL,
            5
        ),
        (
            'Papageorgiou Fugen',
            'Professional business website delivering quality services and solutions.',
            'Website',
            'https://projecpapa.hextech.local',
            'https://papageorgiou-fugen.ch/',
            6
        )
    `;

    console.log('Done! Projects table ready.');
    process.exit(0);
}

setup().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
});
