// Verifies the Microsoft Edge Add-ons credentials without changing anything.
//
// The counterpart to "check-chrome-web-store.mjs", and used the same way: the release workflow runs it before the
// upload so a bad credential fails early and harmlessly - most usefully during a dry run, before a real release
// depends on it.
//
// Unlike the Chrome Web Store, the Edge Add-ons API has no "read the product" endpoint: it exposes only the package
// upload, the publish, and a status read for each. So this reads the status of a *nil* operation ID, which cannot
// exist. A 404 is therefore the success case - it proves the API key and client ID were accepted, which is the thing
// that actually rots (keys expire, and Partner Center shows an expiry date per key).
//
// It cannot prove the product ID is correct: an unknown product 404s just like the missing operation does. Nor can
// it separate a bad key from a product owned by someone else, because the API answers both with 403.
//
// Usage:
//   node scripts/check-edge-add-ons.mjs
//
// Reads EDGE_PRODUCT_ID, EDGE_CLIENT_ID and EDGE_API_KEY from the environment.

const apiUrl = 'https://api.addons.microsoftedge.microsoft.com/v1';

// v1.1 of the API authenticates with an API key rather than a bearer token, and is strict about the scheme name
const authorizationScheme = 'ApiKey';

// Any well-formed GUID that cannot correspond to a real operation
const nilOperationId = '00000000-0000-0000-0000-000000000000';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function checkCredentials({ productId, clientId, apiKey }) {
  const response = await fetch(
    `${apiUrl}/products/${productId}/submissions/draft/package/operations/${nilOperationId}`,
    {
      headers: { Authorization: `${authorizationScheme} ${apiKey}`, 'X-ClientID': clientId },
    },
  );

  // Empirically the API answers a bad API key with 403 rather than 401, and a product you do not own with 403 too,
  // so the two cannot be told apart from the response. The message therefore leads with the expired key, which is by
  // far the more likely of the two once this is working.
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `Microsoft Edge Add-ons refused the request (HTTP ${response.status}). Most likely EDGE_API_KEY is wrong or ` +
        'has expired - Partner Center shows an expiry date against each key, and they are not renewed ' +
        'automatically. Create a new one under Microsoft Edge > Publish API and update EDGE_API_KEY (and ' +
        `EDGE_CLIENT_ID if it changed). Failing that, check EDGE_PRODUCT_ID ('${productId}') is correct and owned ` +
        'by the same Partner Center account, which produces the same status.',
    );
  }

  // The expected outcome: authenticated, then told the operation does not exist
  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');

    throw new Error(
      `Microsoft Edge Add-ons returned an unexpected status when reading an operation (HTTP ${response.status}): ` +
        `${body || '<empty body>'}.`,
    );
  }
}

async function main() {
  const productId = requireEnv('EDGE_PRODUCT_ID');

  await checkCredentials({
    productId,
    clientId: requireEnv('EDGE_CLIENT_ID'),
    apiKey: requireEnv('EDGE_API_KEY'),
  });

  console.log(
    `Microsoft Edge Add-ons credentials are valid and authorised for product '${productId}'. Note this does not ` +
      'prove the product ID itself is correct - the API has no endpoint that can.',
  );
}

try {
  await main();
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);

  console.error(process.env.GITHUB_ACTIONS ? `::error::${message}` : message);
  process.exitCode = 1;
}
