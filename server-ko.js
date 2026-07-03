const express = require('express');
const fs = require('fs');
const path = require('path');
const { VALID_EVENTS, mountTrackingRoutes } = require('./lib/tracking');
const { ko: sheetsKo } = require('./lib/google-sheets');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data', 'ko');
const KO_A_HTML = path.join(PUBLIC_DIR, 'index-ko-a.html');
const KO_B_HTML = path.join(PUBLIC_DIR, 'index-ko-b.html');
const ADMIN_KO_HTML = path.join(PUBLIC_DIR, 'admin-ko.html');

function sendPublicHtml(res, filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`[Static KR] Missing ${label}: ${filePath}`);
    return res.status(404).type('text/plain').send(`Not Found: ${label} is missing on the server`);
  }
  return res.sendFile(filePath);
}

function injectKoApiPrefix(html) {
  if (html.includes('WISHFAST_API_PREFIX')) return html;
  return html.replace(
    '<script src="/js/tracker-ko.js"></script>',
    '<script>window.WISHFAST_API_PREFIX="/api"</script>\n<script src="/js/tracker-ko.js"></script>'
  );
}

function sendKoPage(res, filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`[Static KR] Missing ${label}: ${filePath}`);
    return res.status(404).type('text/plain').send(`Not Found: ${label} is missing on the server`);
  }
  const html = injectKoApiPrefix(fs.readFileSync(filePath, 'utf8'));
  return res.type('html').send(html);
}

app.use(express.json());

mountTrackingRoutes(app, {
  apiPrefix: '/api',
  dataDir: DATA_DIR,
  sheetsSync: sheetsKo,
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    market: 'kr',
    public_dir: PUBLIC_DIR,
    data_dir: DATA_DIR,
    files: {
      index_ko_a: fs.existsSync(KO_A_HTML),
      index_ko_b: fs.existsSync(KO_B_HTML),
      admin_ko: fs.existsSync(ADMIN_KO_HTML),
    },
  });
});

app.get('/', (_req, res) => sendKoPage(res, KO_A_HTML, 'index-ko-a.html (A variant)'));
app.get('/index-ko-a.html', (_req, res) => sendKoPage(res, KO_A_HTML, 'index-ko-a.html (A variant)'));
app.get('/index-ko-b.html', (_req, res) => sendKoPage(res, KO_B_HTML, 'index-ko-b.html (B variant)'));
app.get('/admin', (_req, res) => {
  if (!fs.existsSync(ADMIN_KO_HTML)) {
    return res.status(404).type('text/plain').send('Not Found: admin-ko.html is missing');
  }
  let html = fs.readFileSync(ADMIN_KO_HTML, 'utf8');
  if (!html.includes('WISHFAST_ADMIN_API_PREFIX')) {
    html = html.replace(
      '<script>',
      '<script>window.WISHFAST_ADMIN_API_PREFIX="/api";\n'
    );
  }
  return res.type('html').send(html);
});

app.use(
  express.static(PUBLIC_DIR, {
    index: false,
    extensions: ['html'],
    fallthrough: true,
  })
);

app.use((_req, res) => {
  res.status(404).type('text/plain').send('Not Found');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[KR] Wishtem Korea running at http://0.0.0.0:${PORT}`);
  console.log(`[KR] A variant:  http://0.0.0.0:${PORT}/index-ko-a.html`);
  console.log(`[KR] B variant:  http://0.0.0.0:${PORT}/index-ko-b.html`);
  console.log(`[KR] Admin:      http://0.0.0.0:${PORT}/admin`);
  console.log(`[KR] Data dir:   ${DATA_DIR}`);
  console.log(`[KR] Tracking API: ${VALID_EVENTS.size} accepted event types at /api/*`);
  sheetsKo.logStartupStatus();
});
