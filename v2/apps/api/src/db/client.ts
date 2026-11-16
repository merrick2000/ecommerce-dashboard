import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../lib/env'
import * as schema from './schema'

export const sql = postgres(env.DATABASE_URL, { max: 10, idle_timeout: 30 })
export const db = drizzle(sql, { schema, casing: 'snake_case' })
export type DB = typeof db
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0]
