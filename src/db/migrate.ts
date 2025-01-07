import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { addGeneralChannels } from './migrations/0003_add_general_channels';
import { addSlugs } from './migrations/0004_add_slugs';
import { addMessages } from './migrations/0005_add_messages';
import { addDirectMessages } from './migrations/0006_add_direct_messages';
import { addNotifications } from './migrations/0007_add_notifications';
import { addUnreadMessages } from './migrations/0008_add_unread_messages';
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

    console.log('Adding slugs...');
    await addSlugs();

    console.log('Adding general channels...');
    await addGeneralChannels();

    console.log('Adding messages table...');
    await addMessages();

    console.log('Adding direct messages...');
    await addDirectMessages();

    console.log('Adding notifications...');
    await addNotifications();

    console.log('Adding unread messages...');
    await addUnreadMessages();

    console.log('All migrations completed successfully!');
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