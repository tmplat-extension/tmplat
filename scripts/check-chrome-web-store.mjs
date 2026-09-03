// Verifies the Chrome Web Store credentials without changing anything.
//
// Exchanges the refresh token for an access token, then reads the item back. Used by the release workflow so that
// a bad credential fails early and harmlessly - most usefully during a dry run, before a real release depends on
// it. Nothing here writes to the store; publishing is done by the upload action.
//
// Usage:
//   node scripts/check-chrome-web-store.mjs
//
// Reads CWS_CLIENT_ID, CWS_CLIENT_SECRET, CWS_REFRESH_TOKEN and CWS_EXTENSION_ID from the environment.

const tokenUrl = 'https://oauth2.googleapis.com/token';
const apiUrl = 'https://www.googleapis.com/chromewebstore/v1.1';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function getAccessToken({ clientId, clientSecret, refreshToken }) {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.access_token) {
    const reason = [body.error, body.error_description].filter(Boolean).join(': ') || `HTTP ${response.status}`;
    const hint =
      body.error === 'invalid_grant'
        ? ' The refresh token is no longer valid. Google revokes it if the OAuth consent screen is still in ' +
          '"Testing" (7 days), if it goes 6 months without being used, or if the client secret was rotated. ' +
          'Re-run the OAuth Playground exchange and update CWS_REFRESH_TOKEN.'
        : '';

    throw new Error(`Could not refresh the Chrome Web Store access token (${reason}).${hint}`);
  }

  return body.access_token;
}

async function getItem(accessToken, extensionId) {
  // `projection=DRAFT` is a read of the current draft - it does not create or modify one
  const response = await fetch(`${apiUrl}/items/${extensionId}?projection=DRAFT`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'x-goog-api-version': '2' },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `The Chrome Web Store rejected a read of item '${extensionId}' (HTTP ${response.status}): ` +
        `${JSON.stringify(body)}. Check CWS_EXTENSION_ID, and that the credentials belong to an account with ` +
        'access to that item.',
    );
  }

  return body;
}

async function main() {
  const extensionId = requireEnv('CWS_EXTENSION_ID');
  const accessToken = await getAccessToken({
    clientId: requireEnv('CWS_CLIENT_ID'),
    clientSecret: requireEnv('CWS_CLIENT_SECRET'),
    refreshToken: requireEnv('CWS_REFRESH_TOKEN'),
  });
  const item = await getItem(accessToken, extensionId);

  console.log(
    `Chrome Web Store credentials are valid. Item '${extensionId}' is reachable ` +
      `(uploadState: ${item.uploadState ?? 'unknown'}, crx version: ${item.crxVersion ?? 'none'}).`,
  );
}

try {
  await main();
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);

  console.error(process.env.GITHUB_ACTIONS ? `::error::${message}` : message);
  process.exitCode = 1;
}
