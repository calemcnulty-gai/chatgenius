import { sql } from 'drizzle-orm'
import { db } from '../index'

export async function up() {
  await db.execute(sql`
    UPDATE users 
    SET profile_image = CASE clerk_id
      WHEN 'ai-chael-sonnen' THEN '/chael.jpg'
      WHEN 'ai-conor-mcgregor' THEN '/conor.jpg'
      WHEN 'ai-don-frye' THEN '/don.jpg'
      WHEN 'ai-khabib-nurmagomedov' THEN '/khabib.jpg'
      WHEN 'ai-nate-diaz' THEN '/nate.jpg'
    END
    WHERE clerk_id LIKE 'ai-%';
  `)
} 