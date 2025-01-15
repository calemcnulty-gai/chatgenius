import { sql } from 'drizzle-orm'
import { db } from '../index'

export async function up() {
  await db.execute(sql`
    UPDATE users 
    SET color = CASE clerk_id
      WHEN 'ai-chael-sonnen' THEN '#8B4513'  -- Darker brown
      WHEN 'ai-conor-mcgregor' THEN '#006400'  -- Dark green
      WHEN 'ai-don-frye' THEN '#800000'  -- Maroon
      WHEN 'ai-khabib-nurmagomedov' THEN '#191970'  -- Midnight blue
      WHEN 'ai-nate-diaz' THEN '#4B0082'  -- Indigo
    END
    WHERE clerk_id LIKE 'ai-%';
  `)
} 