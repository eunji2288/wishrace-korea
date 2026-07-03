const { google } = require('googleapis');

const EVENTS_TAB = 'Events';
const CONTACTS_TAB = 'Contacts';

function createSheetsSync(spreadsheetEnvKey, marketLabel) {
  let sheetsApi = null;
  let spreadsheetId = null;
  let headersReady = false;

  function isConfigured() {
    return Boolean(process.env[spreadsheetEnvKey] && process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  function getClient() {
    if (sheetsApi) return sheetsApi;
    if (!isConfigured()) return null;

    try {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      sheetsApi = google.sheets({ version: 'v4', auth });
      spreadsheetId = process.env[spreadsheetEnvKey];
      return sheetsApi;
    } catch (err) {
      console.warn(`[Google Sheets ${marketLabel}] Failed to parse credentials:`, err.message);
      return null;
    }
  }

  async function appendRow(tabName, row) {
    const client = getClient();
    if (!client || !spreadsheetId) return false;

    await client.spreadsheets.values.append({
      spreadsheetId,
      range: `${tabName}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
    return true;
  }

  async function ensureHeaders() {
    if (headersReady || !getClient()) return;

    const headerRanges = [
      {
        tab: EVENTS_TAB,
        values: [
          [
            'created_at',
            'id',
            'event_type',
            'session_id',
            'visitor_id',
            'source',
            'payload_json',
          ],
        ],
      },
      {
        tab: CONTACTS_TAB,
        values: [
          [
            'created_at',
            'id',
            'session_id',
            'visitor_id',
            'source',
            'email',
            'phone',
            'wish_item',
            'goal_amount',
          ],
        ],
      },
    ];

    for (const { tab, values } of headerRanges) {
      try {
        const existing = await sheetsApi.spreadsheets.values.get({
          spreadsheetId,
          range: `${tab}!A1:A1`,
        });
        if (!existing.data.values?.length) {
          await sheetsApi.spreadsheets.values.update({
            spreadsheetId,
            range: `${tab}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
          });
          console.log(`[Google Sheets ${marketLabel}] Header row created on "${tab}"`);
        }
      } catch (err) {
        if (err.code === 400 || /Unable to parse range/i.test(err.message)) {
          await sheetsApi.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
              requests: [{ addSheet: { properties: { title: tab } } }],
            },
          });
          await sheetsApi.spreadsheets.values.update({
            spreadsheetId,
            range: `${tab}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
          });
          console.log(`[Google Sheets ${marketLabel}] Tab "${tab}" created with headers`);
        } else {
          throw err;
        }
      }
    }

    headersReady = true;
  }

  function queue(fn) {
    fn().catch((err) => console.warn(`[Google Sheets ${marketLabel}]`, err.message));
  }

  async function appendEvent(record) {
    if (!getClient()) return;
    await ensureHeaders();
    await appendRow(EVENTS_TAB, [
      record.created_at,
      record.id,
      record.event_type,
      record.session_id,
      record.visitor_id || '',
      record.source || '',
      record.payload ? JSON.stringify(record.payload) : '',
    ]);
  }

  async function appendContact(record) {
    if (!getClient()) return;
    await ensureHeaders();
    await appendRow(CONTACTS_TAB, [
      record.created_at,
      record.id,
      record.session_id,
      record.visitor_id || '',
      record.source || '',
      record.email || '',
      record.phone || '',
      record.wish_item || '',
      record.goal_amount || '',
    ]);
  }

  function syncEvent(record) {
    if (!isConfigured()) return;
    queue(() => appendEvent(record));
  }

  function syncContact(record) {
    if (!isConfigured()) return;
    queue(() => appendContact(record));
  }

  function logStartupStatus() {
    if (isConfigured()) {
      console.log(
        `[Google Sheets ${marketLabel}] Sync enabled → spreadsheet`,
        process.env[spreadsheetEnvKey]
      );
    } else {
      console.log(
        `[Google Sheets ${marketLabel}] Sync disabled (set ${spreadsheetEnvKey} + GOOGLE_SERVICE_ACCOUNT_JSON)`
      );
    }
  }

  return {
    syncEvent,
    syncContact,
    logStartupStatus,
    isConfigured,
  };
}

const my = createSheetsSync('GOOGLE_SHEET_ID', 'MY');
const ko = createSheetsSync('GOOGLE_SHEET_ID_KO', 'KR');

module.exports = {
  syncEvent: my.syncEvent,
  syncContact: my.syncContact,
  logStartupStatus: my.logStartupStatus,
  isConfigured: my.isConfigured,
  my,
  ko,
  createSheetsSync,
};
