import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { addGeneralChannels } from './migrations/0003_add_general_channels';
import { addSlugs } from './migrations/0004_add_slugs';
import * as dotenv from 'dotenv';

// Load environment variables before anything else
dotenv.config();

// Log the connection string to verify it's loaded
console.log('Using database URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function main() {
  try {
    // Test the connection
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');

    console.log('Running migrations...');
    await migrate(db, { migrationsFolder: 'drizzle' });

    console.log('Adding general channels...');
    await addGeneralChannels();

    console.log('Adding slugs...');
    await addSlugs();

    console.log('Migrations complete');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Error performing migrations:', err);
  process.exit(1);
}); 