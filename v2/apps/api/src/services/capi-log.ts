/** Journal des envois à l'API Conversions de Meta : les 20 derniers par boutique, visibles dans Paramètres, Suivi. */
import { eq, sql as dsql } from 'drizzle-orm'
import { db } from '../db/client'
import { checkoutSettings, type CapiLogEntry } from '../db/schema'

export async function recordCapi(storeId: string, entry: Omit<CapiLogEntry, 'at'>) {
  const row: CapiLogEntry = { at: new Date().toISOString(), ...entry }
  await db
    .update(checkoutSettings)
    .set({ capiLog: dsql`(jsonb_build_array(${JSON.stringify(row)}::jsonb) || coalesce(${checkoutSettings.capiLog}, '[]'::jsonb)) #- '{20}'` })
    .where(eq(checkoutSettings.storeId, storeId))
    .catch((e) => console.warn('[capi] journal', e))
}
