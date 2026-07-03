const fs = require('fs');
const path = require('path');

const replacer =
  /<script>\r?\n\(function \(\) \{\r?\n  const STORAGE_KEY = 'wishfast_events';[\s\S]*?\}\)\(\);\r?\n\r?\n<\/script>/;

const insert = '<script src="/js/tracker-ko.js"></script>';

for (const name of ['index-ko-a.html', 'index-ko-b.html']) {
  const file = path.join(__dirname, '..', 'public', name);
  let content = fs.readFileSync(file, 'utf8');
  if (!replacer.test(content)) {
    console.error(`[swap-ko-tracker] No inline tracker found in ${name}`);
    process.exitCode = 1;
    continue;
  }
  content = content.replace(replacer, insert);
  content = content.replace(
    'Tracking: LocalStorage wishfast_events / wishfast_contacts',
    'Tracking: LocalStorage wishfast_ko_events / wishfast_ko_contacts'
  );
  content = content.replace(
    'With node server.js: also posts to /api/events · /api/contacts -->',
    'Tracking KR: /api/ko/events · /api/ko/contacts (server-ko.js for KR-only deploy) -->'
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log(`[swap-ko-tracker] Updated ${name}`);
}
