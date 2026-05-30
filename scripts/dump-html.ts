import { neon } from '@neondatabase/serverless'
import fs from 'fs'

const sql = neon(process.env.DATABASE_URL!)
const r = await sql`
  SELECT DISTINCT ON (model_name) model_name, html_output
  FROM generations
  ORDER BY model_name, created_at DESC
`
for (const g of r as any[]) {
  const filename = `/tmp/${g.model_name}.html`
  fs.writeFileSync(filename, g.html_output)
  console.log('Written:', filename)
}
