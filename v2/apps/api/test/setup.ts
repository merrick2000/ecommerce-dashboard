// Préchargé par bunfig.toml : base de test isolée, migrée et vidée avant la suite.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://sellit:sellit@127.0.0.1:5440/sellit_test'
process.env.APP_KEY ??= Buffer.alloc(32, 7).toString('base64')

const { migrate } = await import('drizzle-orm/postgres-js/migrator')
const { db, sql } = await import('../src/db/client')
await migrate(db, { migrationsFolder: new URL('../drizzle', import.meta.url).pathname })
const tables = await sql<{ tablename: string }[]>`select tablename from pg_tables where schemaname = 'public' and tablename not like '__drizzle%'`
if (tables.length) await sql.unsafe(`truncate ${tables.map((t) => `"${t.tablename}"`).join(', ')} restart identity cascade`)
