import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../lib/env'
import * as schema from './schema'

/**
 * Garde-fous : une requête SQL ou une attente de verrou ne peut plus bloquer indéfiniment
 * (l'utilisateur verrait un bouton « Enregistrer » qui tourne sans fin).
 */
export const sql = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
  // Toutes les connexions occupées : on échoue au bout de 15 s au lieu d'attendre sans fin.
  queue_timeout: 15,
  connection: {
    statement_timeout: 20_000,
    lock_timeout: 10_000,
    idle_in_transaction_session_timeout: 60_000,
  },
})
export const db = drizzle(sql, { schema, casing: 'snake_case' })
export type DB = typeof db
export type Tx = Parameters<Parameters<DB['transaction']>[0]>[0]
