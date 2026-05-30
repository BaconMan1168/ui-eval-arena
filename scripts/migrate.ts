import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { Pool, neonConfig } from '@neondatabase/serverless'

// Node.js 24 has native WebSocket
neonConfig.webSocketConstructor = WebSocket

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED
  if (!url) throw new Error('DATABASE_URL_UNPOOLED is not set')

  const pool = new Pool({ connectionString: url })
  const client = await pool.connect()

  try {
    const migrationsDir = join(process.cwd(), 'migrations')
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf8')
      await client.query(sql)
      console.log(`Ran ${file}`)
    }
    console.log('All migrations complete.')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
