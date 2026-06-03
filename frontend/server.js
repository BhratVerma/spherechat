const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const app = next({ dev: true })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert.key')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.crt')),
}

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    // Allow CORS for mixed content
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', '*')

    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, (err) => {
    if (err) throw err
    console.log('')
    console.log('╔══════════════════════════════════════╗')
    console.log('║  SphereChat Frontend — HTTPS ready   ║')
    console.log('╚══════════════════════════════════════╝')
    console.log('✅  https://localhost:3000')
    console.log('')
  })
})