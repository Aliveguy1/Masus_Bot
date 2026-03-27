const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const path = require('path');
const http = require('http');
const qrcode = require('qrcode');
const { handleMessage } = require('./handler');

const AUTH_DIR = path.join(__dirname, '../auth_info');

let latestQR = null; // Stores latest QR string

// ── Simple HTTP server to display QR in browser ──────────────────────────────
const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    if (!latestQR) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html><body style="background:#111;color:#0f0;font-family:monospace;text-align:center;padding:50px">
          <h2>✅ WhatsApp Bot is Connected!</h2>
          <p>No QR needed — session is active.</p>
        </body></html>
      `);
    } else {
      // Generate QR as image
      const qrImage = await qrcode.toDataURL(latestQR);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html><body style="background:#111;color:#fff;font-family:monospace;text-align:center;padding:30px">
          <h2>📱 Scan this QR Code with WhatsApp</h2>
          <p>WhatsApp → Settings → Linked Devices → Link a Device</p>
          <img src="${qrImage}" style="width:300px;height:300px;border:4px solid #0f0;border-radius:8px" />
          <p style="color:#aaa">Page auto-refreshes every 30 seconds</p>
          <script>setTimeout(()=>location.reload(), 30000)</script>
        </body></html>
      `);
    }
  } else {
    res.writeHead(404); res.end();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🌐 QR server running on port ${PORT}`));
// ─────────────────────────────────────────────────────────────────────────────

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    browser: ['WhatsApp Bot', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      latestQR = qr; // Save for web display
      console.log('📱 QR updated — open your Railway public URL to scan');
    }

    if (connection === 'open') {
      latestQR = null; // Clear QR once connected
      console.log('✅ Bot connected to WhatsApp!');
    }

    if (connection === 'close') {
      const shouldReconnect =
        new Boom(lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      await handleMessage(sock, msg);
    }
  });
}

startBot().catch(console.error);
