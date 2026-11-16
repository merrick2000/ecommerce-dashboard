import type { StoreRole } from '@sellit/shared'
import type { Store, User } from '../db/schema'

export type AppEnv = {
  Variables: {
    user: User
    sessionId: string
    store: Store
    role: StoreRole
  }
}
