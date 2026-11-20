import type { Permission, StoreRole } from '@zuri/shared'
import type { Store, User } from '../db/schema'

export type AppEnv = {
  Variables: {
    user: User
    sessionId: string
    store: Store
    role: StoreRole
    /** Droits effectifs du membre sur la boutique courante (rôle + options). */
    access: StoreAccess
    /** Requête authentifiée par une clé API (IA, MCP) plutôt que par une session. */
    apiKey?: ApiKeyAuth
  }
}

export interface StoreAccess {
  userId: number
  role: StoreRole
  permissions: ReadonlySet<Permission>
  /** null = tous les produits ; sinon les seuls produits visibles (commandes, clients, stats, notifications). */
  productIds: string[] | null
}

export interface ApiKeyAuth {
  id: number
  name: string
  /** null = toutes les boutiques du compte. */
  storeId: string | null
  scope: 'read' | 'write'
}
