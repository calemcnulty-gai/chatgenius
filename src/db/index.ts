import { drizzle } from 'drizzle-orm/node-postgres'
import { pool } from './pool'
import { queryConfig } from './schema'

export const db = drizzle(pool, { schema: queryConfig }) 