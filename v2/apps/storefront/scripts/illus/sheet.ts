// Planche contact : bun sheet.ts <dir> <out.png> [cols] [w]
import sharp from '/home/merrick/Works/ecommerce-dashboard/v2/node_modules/.bun/sharp@0.35.5+524d27868019c7b5/node_modules/sharp/dist/index.cjs'
import { readdirSync } from 'node:fs'
const [dir, out, colsS, wS] = process.argv.slice(2)
const cols = +(colsS ?? 4), w = +(wS ?? 400)
const files = readdirSync(dir!).filter((f) => /\.(webp|jpg)$/.test(f)).sort()
const first = await sharp(`${dir}/${files[0]}`).metadata()
const h = Math.round((w * first.height!) / first.width!)
const rows = Math.ceil(files.length / cols)
const comps = await Promise.all(files.map(async (f, i) => ({ input: await sharp(`${dir}/${f}`).resize(w, h).toBuffer(), left: (i % cols) * (w + 8), top: Math.floor(i / cols) * (h + 8) })))
await sharp({ create: { width: cols * (w + 8), height: rows * (h + 8), channels: 3, background: '#ffffff' } }).composite(comps).png().toFile(out!)
console.log(files.join('\n'))
