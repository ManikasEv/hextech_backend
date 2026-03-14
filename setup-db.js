require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);

function imgToBase64(filename) {
    const filePath = path.join(__dirname, '../src/assets', filename);
    if (!fs.existsSync(filePath)) return null;
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(filename).replace('.', '');
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${mime};base64,${buf.toString('base64')}`;
}

async function setup() {
    console.log('Updating projects table schema...');

    // Add image_data column for base64 if not exists
    await sql`
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS image_data TEXT
    `;

    console.log('Seeding projects with real images...');
    await sql`DELETE FROM projects`;

    const portfolioImg  = imgToBase64('portfoliomani.png');
    const ioInsideImg   = imgToBase64('ioinside.png');
    const papageImg     = imgToBase64('projecpapa.png');

    await sql`
        INSERT INTO projects (title, description, type, image_url, image_data, link, sort_order) VALUES
        (
            'Portfolio',
            'Personal portfolio website showcasing creative work, projects, and professional achievements with modern design.',
            'Website',
            'https://www.manikasevangelos.com/',
            ${portfolioImg},
            'https://www.manikasevangelos.com/',
            1
        ),
        (
            'Musician Portfolio',
            'Portfolio website for a professional musician — showcasing discography, events, and press kit.',
            'Website',
            'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop',
            ${null},
            null,
            2
        ),
        (
            'Inside Observation',
            'Professional website dedicated to energy therapies, holistic wellness, and spiritual healing services.',
            'Website',
            'https://insideobservation.com/',
            ${ioInsideImg},
            'https://insideobservation.com/',
            3
        ),
        (
            'AI Software Platform',
            'Advanced AI-powered software solution built with Flowise for intelligent automation and workflows.',
            'Software',
            'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop',
            ${null},
            null,
            4
        ),
        (
            'Booking & Invitation System',
            'Comprehensive software for managing bookings and sending automated invitations to clients.',
            'Software',
            'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop',
            ${null},
            null,
            5
        ),
        (
            'Papageorgiou Fugen',
            'Professional business website delivering quality services and solutions.',
            'Website',
            'https://papageorgiou-fugen.ch/',
            ${papageImg},
            'https://papageorgiou-fugen.ch/',
            6
        )
    `;

    console.log('Done! Projects seeded with images.');
    process.exit(0);
}

setup().catch(err => {
    console.error('Setup failed:', err);
    process.exit(1);
});
